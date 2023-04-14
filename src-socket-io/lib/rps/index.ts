import {ServerHandler} from "../socket/ServerHandler";
import type {Socket} from "socket.io";

type RockPaperScissorEvents = {
    create: {
        password: string;
    },
    join: {
        name: string;
        roomId: string;
        password: string;
    }
    play: {
        key: string;
        choice: 'rock' | 'paper' | 'scissor';
        roomId: string;
    }
};

/*
somebody calls the rps:create endpoint with a password
the person then gets a room id --> emitRoomCreated(roomId, socket)

a room is then created with the room id and the password
    the room has a timer that deletes the room after 5 minutes if nobody joined
    the room also has a timer that deletes the room after 10 minutes if nobody played
    after the room is deleted an event is emitted to the client that the room was deleted

any person can join the room by calling the rps:join endpoint with the room id and password
    the person then gets a key --> emitRoomJoined(key, socket)
    if the room is full, the person gets an error --> emitRoomFull(socket)
    if the room doesn't exist, the person gets an error --> emitRoomDoesntExist(socket)
    if the password is wrong, the person gets an error --> emitWrongPassword(socket) maybe replaced with emitRoomDoesntExist(socket) for security

the person then calls the rps:play endpoint with the key and the choice
    if the key is wrong, the person gets an error --> emitError(socket, "wrong key")
    if the choice is wrong, the person gets an error --> emitError(socket, "unknown choice")
    if the person already played, the person gets an error --> emitError(socket, "already played")


 */

/*
client events


 */

const possibleChoices = ['rock', 'paper', 'scissor'];

type State = 'nobodyJoinedTimeout' | 'timeout' | 'played';

type RockPaperScissorPlayer = {
    socket: Socket;
    name: string;
    identifier: string;
}

class RockPaperScissorGame {

    private cbNobodyJoinedTimeout?: () => void;
    private cbTimeOut?: () => void;
    private cbPlayed?: (winner?: RockPaperScissorPlayer) => void;
    private cbEnded?: () => void;

    constructor(public readonly roomId: string, public readonly password: string, private nobodyJoinedTimeout: number = 1000 * 60 * 5, private timeOut: number = 1000 * 60 * 15) {
    }


    whenEnded(cb: () => void) {
        this.cbEnded = cb;
    }


    whenTimeout(cb: () => void) {
        this.cbTimeOut = cb;
    }

    whenNobodyJoinedTimeout(cb: () => void) {
        this.cbNobodyJoinedTimeout = cb;
    }

    whenPlayed(cb: (winner?: RockPaperScissorPlayer) => void) {
        this.cbPlayed = cb;
    }


    private finished = false;


    private timers: { timeout?: NodeJS.Timeout, nobodyJoinedTimeout?: NodeJS.Timeout } = {};

    /**
     * starts the timers
     *
     * if the game is already finished, the timers won't be started
     * if timers are already running, they will be cleared
     *
     * it the callbacks are not set when this function is called, the timers won't be started
     */
    startTimer() {
        if (this.finished) return;

        if (this.timers["timeout"]) clearTimeout(this.timers["timeout"]);
        if (this.timers["nobodyJoinedTimeout"]) clearTimeout(this.timers["nobodyJoinedTimeout"]);

        if (this.cbTimeOut) {
            const timeout = setTimeout(() => {
                this.cbTimeOut!();
                this.finished = true;
            }, this.timeOut);
            this.timers["timeout"] = timeout;
        }
        if (this.cbNobodyJoinedTimeout) {
            const nobodyJoinedTimeout = setTimeout(() => {
                this.cbNobodyJoinedTimeout!();

                this.finished = true;
            }, this.nobodyJoinedTimeout);
            this.timers["nobodyJoinedTimeout"] = nobodyJoinedTimeout;
        }
    }


    private removeTimer() {
        if (this.timers["nobodyJoinedTimeout"]) {
            clearTimeout(this.timers["nobodyJoinedTimeout"]);
            this.timers["nobodyJoinedTimeout"] = undefined;
        }

        if (this.timers["timeout"]) {
            clearTimeout(this.timers["timeout"]);
            this.timers["timeout"] = undefined;
        }

    }

    end() {
        this.removeTimer();
        this.finished = true;
        this.cbEnded?.();
    }


    private playerOne?: RockPaperScissorPlayer;
    private playerTwo?: RockPaperScissorPlayer;

    private playerOneChoice?: 'rock' | 'paper' | 'scissor';
    private playerTwoChoice?: 'rock' | 'paper' | 'scissor';

    private playedOut = false;

    setPlayerOne(socket: Socket, name: string): string {
        const identifier = `${this.roomId}-${socket.id}-${name}`;
        this.playerOne = {socket, name, identifier};
        return identifier;
    }

    joinPlayer(socket: Socket, name: string, password: string): string | null {
        if (password !== this.password) {
            this.emitError("wrong password");
            return null;
        }

        if (socket.id === this.playerOne?.socket.id || socket.id === this.playerTwo?.socket.id) {
            this.emitError("already joined");
            return null;
        }

        if (this.playerOne) {
            return this.setPlayerTwo(socket, name);
        } else {
            if (this.playerTwo) {
                this.emitError("room full");
                return null;
            }
            return this.setPlayerOne(socket, name);
        }

    }

    setPlayerTwo(socket: Socket, name: string) {
        const identifier = `${this.roomId}-${socket.id}-${name}`;
        this.playerTwo = {socket, name, identifier};
        return identifier;
    }

    setPlayerOneChoice(choice: 'rock' | 'paper' | 'scissor') {
        if (!possibleChoices.includes(choice)) {
            this.emitError("unknown choice");
            return;
        }
        if (this.playerOneChoice) {
            this.emitError("already played");
            return;
        }
        this.playerOneChoice = choice;
        if (this.playerTwoChoice) {
            this.playOut();
        }
    }

    playOut() {
        if (this.cbPlayed) {
            this.cbPlayed(this.winner);
        }
        this.emitResult();
        this.end();
    }

    /**
     * returns 0 if it's a draw
     * returns 1 if player one won
     * returns 2 if player two won
     */
    get winner(): RockPaperScissorPlayer | undefined {
        let choice = 0;
        if (this.playerOneChoice === this.playerTwoChoice) {
            choice = 0;
        } else if (
            (this.playerOneChoice === "rock" && this.playerTwoChoice === "scissor") ||
            (this.playerOneChoice === "paper" && this.playerTwoChoice === "rock") ||
            (this.playerOneChoice === "scissor" && this.playerTwoChoice === "paper")
        ) {
            choice = 1;
        } else {
            choice = 2;
        }

        switch (choice) {
            case 0:
                return undefined;
            case 1:
                return this.playerOne;
            case 2:
                return this.playerTwo;
            default:
                return undefined;
        }


    }

    play(key: string, choice: 'rock' | 'paper' | 'scissor') {
        if (this.playerOne?.identifier === key) {
            this.setPlayerOneChoice(choice);
        } else if (this.playerTwo?.identifier === key) {
            this.setPlayerTwoChoice(choice);
        } else {
            this.emitError("unknown key");
        }
    }

    setPlayerTwoChoice(choice: 'rock' | 'paper' | 'scissor') {
        if (!possibleChoices.includes(choice)) {
            this.emitError("unknown choice");
            return;
        }

        if (this.playerTwoChoice) {
            this.emitError("already played");
            return;
        }
        this.playerTwoChoice = choice;
        if (this.playerOneChoice) {
            this.emitResult();
        }
    }

    emitResult() {
        this.playedOut = true;
        if (this.playerOne) this.playerOne.socket.emit("result", this.winner?.name);
        if (this.playerTwo) this.playerTwo.socket.emit("result", this.winner?.name);
    }

    emitError(error: string) {
        if (this.playerOne) this.playerOne.socket.emit("error", error);
        if (this.playerTwo) this.playerTwo.socket.emit("error", error);
    }
}

class RockPaperScissorHandler extends ServerHandler<RockPaperScissorEvents> {

    generateRoomName() {
        return (Math.random() * 100000).toString(16);
    }

    private games: RockPaperScissorGame[] = [];

    removeGame(game: RockPaperScissorGame) {
        const index = this.games.indexOf(game);
        if (index > -1) {
            this.games.splice(index, 1);
        }
    }

    constructor() {
        super("rps", {
            "create": (data, socket) => {
                const password = data.password;
                const game = new RockPaperScissorGame(this.generateRoomName(), password);

                this.games.push(game);

                game.whenNobodyJoinedTimeout(() => {
                    game.end();
                });

                game.whenEnded(() => {
                    this.removeGame(game);
                });

                game.whenTimeout(() => {
                    game.end();
                });

                game.whenPlayed((winner) => {
                    console.log(winner);
                });

                game.startTimer();
                this.emitRoomCreated(game.roomId, socket);
            },
            "join": ({password, roomId, name}, socket) => {
                const game = this.games.find(game => game.roomId === roomId);
                if (!game) {
                    this.emitError(socket, "room not found");
                    return;
                }
                const identifier = game.joinPlayer(socket, name, password);
                if (identifier) {
                    this.emitRoomJoined(roomId, socket);
                } else {
                    this.emitError(socket, "join failed");
                }
            },
            "play": ({choice, key, roomId}, socket) => {
                const game = this.games.find(game => game.roomId === roomId);
                if (!game) {
                    this.emitError(socket, "room not found");
                    return;
                }

                game.play(key, choice);
            }

        });
    }

    emitError(socket: Socket, error: string) {
        socket.emit("error", error);
    }

    emitRoomCreated(roomId: string, socket: Socket) {
        socket.emit("created", roomId);
    }

    emitRoomJoined(roomName: string, socket: Socket) {
        socket.emit("joined", roomName);
    }


}