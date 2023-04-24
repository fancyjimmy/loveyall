/*
import {
    type LobbyInfo,
    type LobbyLifeCycleEvents,
    LobbyRole,
    type Player,
    type PlayerAuthenticationResponse
} from "./manage/types";
import {DefaultRolePolicy, type RolePolicy} from "./policy/role";
import type {Socket} from "socket.io";
import {LifeCycle} from "../../utilities/LifeCycle";
import crypto from "crypto";
import {DefaultLobbyTimeoutPolicy, LobbyTimeoutPolicy} from "./policy/time";

export class Lobby {
    get players(): Player<any>[] {
        return this.#players;
    }

    #players: Player<any>[] = [];
    public readonly lifeCycle = new LifeCycle<LobbyLifeCycleEvents>();
    private readonly rolePolicy: RolePolicy;
    private readonly timeoutPolicy: LobbyTimeoutPolicy;
    private readonly secret: string;

    constructor(public readonly lobbyInfo: LobbyInfo) {
        this.rolePolicy = new DefaultRolePolicy();
        this.timeoutPolicy = new DefaultLobbyTimeoutPolicy({minutes: 5});
        this.lifeCycle.when("playerRemoved", ({player}) => {
            if (player.role === LobbyRole.HOST) {
                const nextHost = this.rolePolicy.nextHost(this.#players, player);
                if (nextHost) {
                    nextHost.role = LobbyRole.HOST;
                }
                this.lifeCycle.emit("hostChanged", {player: nextHost});
            }
        });

        this.secret = this.generateSecret();
    }

    public joinAsHost(socket: Socket, username: string): PlayerAuthenticationResponse {
        return this.join(socket, username);
    }

    public isFull(): boolean {
        return this.#players.length >= this.lobbyInfo.settings.maxPlayers;
    }

    public userExists(username: string): boolean {
        return this.#players.some(player => player.username === username);
    }

    private generateSecret(): string {
        return crypto.randomUUID();
    }

    private hash(key: string): string {
        let hash = crypto.createHash("sha256").update(key).digest("hex");
        return hash;
    }

    private generateSessionKey(username: string): string {
        return `${this.lobbyInfo.lobbyId}${username}${this.secret}`;
    }

    public tryJoin(socket: Socket, username: string, password: string): PlayerAuthenticationResponse {
        if (this.isFull()) {
            throw new Error("Lobby is full");
        }
        if (this.lobbyInfo.isPrivate && this.lobbyInfo.authenticationPolicy.password !== password) {
            throw new Error("Password is incorrect");
        }

        return this.join(socket, username);
    }

    private join(socket: Socket, username: string): PlayerAuthenticationResponse {
        username = username.trim(); // trim the username
        let role = LobbyRole.PLAYER;
        if (this.#players.length === 0) {
            role = LobbyRole.HOST;
        }
        const player: Player<any> = {
            socket,
            username,
            role: role,
            joinedTime: new Date(),
            sessionKey: "",
            extra: undefined
        };

        let count = 1;
        while (this.userExists(player.username)) {
            player.username = `${player.username}#${count++}`;
        }

        const sessionKey = this.generateSessionKey(player.username);
        const hashedSessionKey = this.hash(sessionKey);

        player.sessionKey = hashedSessionKey;


        this.startSocketEvents(socket);
        this.#players.push(player);
        this.lifeCycle.emit("joined", {player});
        this.playerChanged(player, true);

        return {username: player.username, sessionKey: hashedSessionKey};
    }

    private playerChanged(player: Player<any>, joined: boolean): void {
        this.lifeCycle.emit("playerChanged", {player, allPlayers: this.#players, joined});
    }

    private startSocketEvents(socket: Socket): void {
        socket.join(this.lobbyInfo.lobbyId);
        //socket.on("disconnect", () => this.disconnect(socket));
        socket.on("leave", () => this.leave(socket));
    }

    public leave(socket: Socket): void {
        const player = this.#players.find(player => player.socket === socket);
        if (player) {
            socket.leave(this.lobbyInfo.lobbyId);
            this.lifeCycle.emit("left", {player});
            this.removePlayer(player);
        }
        this.disconnect(socket);
    }


    private removePlayer(player: Player<any>): void {
        this.#players = this.#players.filter(p => p !== player);
        this.lifeCycle.emit("playerRemoved", {player});
        this.lifeCycle.emit("playerChanged", {player, allPlayers: this.#players, joined: false});
    }

    public tryReconnect(socket: Socket, sessionKey: string): Player<any> {
        const player = this.#players.find(player => player.sessionKey === sessionKey);
        if (player) {
            return this.reconnect(socket, player);
        } else {
            throw new Error("Invalid session key");
        }

    }

    private reconnect(socket: Socket, player: Player<any>): Player<any> {
        this.startSocketEvents(socket);
        console.log(`${player.username} is reconnecting`);
        player.socket = socket;
        player.reconnecting = false;
        this.playerChanged(player, false);
        return player;
    }

    public waitForReconnect(socket: Socket, time: number) {
        let player = this.getPlayerBySessionKey(socket.handshake.auth.token);

        player!.reconnecting = true;
        console.log(`${player?.username} is waiting for reconnect`);

        //TODO make this cleaner, because this is buggy
        setTimeout(() => {
            let player = this.getPlayerBySessionKey(socket.handshake.auth.token);
            console.log(player?.reconnecting);
            if (player?.reconnecting === true) {
                console.log(`${player?.username} is not reconnecting anymore`);
                this.disconnect(player!.socket);
            } else {
                console.log(`${player?.username} is reconnected`);
            }
        }, time);
    }

    public disconnect(socket: Socket): void {
        const player = this.#players.find(player => player.socket === socket);
        if (player) {
            this.removePlayer(player);
        }
        this.lifeCycle.emit("disconnected", {socket});
    }

    getPlayerBySessionKey(sessionKey: string): Player<any> | undefined {
        return this.#players.find(player => {
            return player.sessionKey === sessionKey;
        });
    }

    isHost(socket: Socket) {
        let user = this.getPlayerBySessionKey(socket.handshake.auth.sessionKey);
        if (user) {
            return user.role === LobbyRole.HOST;
        }
        return false;
    }

    kick(username: string) {
        let player = this.#players.find(player => player.username === username);
        if (player) {
            this.removePlayer(player);
        }
    }
}
 */

export type Test = "s";