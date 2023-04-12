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

const possibleChoices = ['rock', 'paper', 'scissor'];

type State = 'nobodyJoinedTimeout' | 'timeout' | 'played';

class RockPaperScissorGame {

    private cbNobodyJoinedTimeout?: () => void;
    private cbTimeOut?: () => void;
    private cbPlayed?: (winner?: Socket) => void;
    private cbEnded?: () => void;

    constructor(private roomId: string, private password: string, private nobodyJoinedTimeout: number = 1000 * 60 * 5, private timeOut: number = 1000 * 60 * 15) {
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

    whenPlayed(cb: (winner?: Socket) => void) {
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


    removeTimer() {
        if (this.timers["nobodyJoinedTimeout"]) {
            clearTimeout(this.timers["nobodyJoinedTimeout"]);
            this.timers["nobodyJoinedTimeout"] = undefined;
        }

        if (this.timers["timeout"]) {
            clearTimeout(this.timers["timeout"]);
            this.timers["timeout"] = undefined;
        }

    }


    private playerOne?: Socket;
    private playerTwo?: Socket;

    private playerOneChoice?: 'rock' | 'paper' | 'scissor';
    private playerTwoChoice?: 'rock' | 'paper' | 'scissor';

    private playedOut = false;

    setPlayerOne(socket: Socket) {
        this.playerOne = socket;
    }

    setPlayerTwo(socket: Socket) {
        this.playerTwo = socket;
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
            this.emitResult();
        }
    }

    playOut() {
        if (this.cbPlayed) {
            this.cbPlayed(this.winner);
        }
    }

    /**
     * returns 0 if it's a draw
     * returns 1 if player one won
     * returns 2 if player two won
     */
    get winner(): Socket | undefined {
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
    }

    emitError(error: string) {
        if (this.playerOne) this.playerOne.emit("error", error);
        if (this.playerTwo) this.playerTwo.emit("error", error);
    }
}

class RockPaperScissorHandler extends ServerHandler<RockPaperScissorEvents> {

    generateRoomName() {
        return (Math.random() * 100000).toString(16);
    }

    constructor() {
        super("rps", {
            "create": (data, socket) => {
                const password = data.password;
                const game = new RockPaperScissorGame(this.generateRoomName(), password);

                game.whenPlayed((winner) => {

                });
            },
            "join": (data, socket) => {

            },
            "play": (data, socket) => {

            }

        });
    }

    emitRoomCreated(roomName: string, socket: Socket) {
        socket.emit("roomCreated", roomName);
    }

}