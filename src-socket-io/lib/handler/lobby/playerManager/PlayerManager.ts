import {LobbyRole, type PlayerInfo} from '../types';
import type {LobbyJoinOption} from '../manage/types';
import ClientError from '../../../ClientError';
import type {Socket} from "socket.io";
import PlayerTimeoutPolicy from "../policy/time/player/PlayerTimeoutPolicy";
import {Listener} from "../../../utilities/Listener";
import * as crypto from "crypto";
import type {RolePolicy} from "../policy/role";

type PlayerExtraData = {
    timeout: PlayerTimeoutPolicy,
    socketId: string | null,
}
export default class PlayerManager {
    private playerMap: Map<PlayerInfo, PlayerExtraData> = new Map<PlayerInfo, PlayerExtraData>();
    private playerRemoveListener = new Listener<(player: PlayerInfo, players: PlayerInfo[]) => void>();
    private playerChangeListener = new Listener<(players: PlayerInfo[]) => void>();
    private playerAddListener = new Listener<(player: PlayerInfo, players: PlayerInfo[]) => void>();

    constructor(public readonly maxPlayers: number, public readonly rolePolicy: RolePolicy, private readonly milliseconds: number = 1000 * 60 * 5) {
        this.playerRemoveListener.addListener((player, players) => {
            this.rolePolicy.setNextHost(players, player);

            console.log(player);
        });
        this.playerChangeListener.addListener((players) => {
            console.log(players.length);
        });

        this.playerAddListener.addListener((player, players) => {
            console.log(player);
        });

    }

    private get players(): PlayerInfo[] {
        return Array.from(this.playerMap.keys());
    }

    removePlayer(socket: Socket) {
        const player = this.getPlayer(socket.handshake.auth.token);
        if (!player) {
            return;
        }
        this.deletePlayer(player);
    }

    bindPlayerFromSocket(socket: Socket) {
        const player = this.getPlayer(socket.handshake.auth.token);
        if (!player) {
            throw new ClientError('Player not found');
        }

        console.log('bind  ' + player.username);


        if (this.playerMap.get(player)!.socketId !== null) {
            throw new ClientError('Already online');
        }

        socket.data = {
            player: player
        };

        this.playerMap.get(player)!.socketId = socket.id;
        this.playerMap.get(player)!.timeout.trigger('bind', null);
    }

    getPlayer(token: string): PlayerInfo | undefined {
        return this.players.find((player) => player.sessionKey === token);
    }

    addPlayer(joinOptions: LobbyJoinOption) {
        if (this.players.length >= this.maxPlayers) {
            throw new ClientError('Max players reached');
        }
        const sessionKey = this.generateSessionKey();

        const role = this.players.length === 0 ? LobbyRole.HOST : LobbyRole.PLAYER;
        const username = this.getUniqueUsername(joinOptions.username);
        const player: PlayerInfo = {
            username: username,
            role: role,
            joinedTime: new Date(),
            sessionKey
        };

        const playerTimeoutPolicy = new PlayerTimeoutPolicy(this.milliseconds);


        this.playerMap.set(player, {
            timeout: playerTimeoutPolicy,
            socketId: null,
        });

        playerTimeoutPolicy.onTimeout(() => {
            this.deletePlayer(player);
        });

        this.playerChangeListener.call(this.players);
        this.playerAddListener.call(player, this.players);
        return player;
    }

    unbindPlayerFromSocket(socket: Socket<{ player: PlayerInfo }>) {
        if ((this.playerMap.get(socket.data.player)?.socketId) === null) {
            throw new ClientError('Player isn\'t connected to socket, event though it passed the connection');
        }

        this.playerMap.get(socket.data.player)!.socketId = null;
        this.playerMap.get(socket.data.player)!.timeout.trigger("disconnect", null);
        socket.data = {};
    }

    private getUniqueUsername(username: string): string {
        let count = 1;
        let newUsername = username;
        const players = this.players;
        while (players.map(player => player.username).includes(newUsername)) {
            newUsername = `${username}#${count++}`;
        }
        return newUsername;
    }

    getPlayers(): PlayerInfo[] {
        return this.players;
    }

    onPlayerRemove(listener: (player: PlayerInfo, players: PlayerInfo[]) => void): number {
        return this.playerRemoveListener.addListener(listener);
    }

    onPlayerChange(listener: (players: PlayerInfo[]) => void): number {
        return this.playerChangeListener.addListener(listener);
    }

    onPlayerAdd(listener: (player: PlayerInfo, players: PlayerInfo[]) => void): number {
        return this.playerAddListener.addListener(listener);
    }

    private deletePlayer(player: PlayerInfo) {
        this.playerMap.delete(player);
        this.playerChangeListener.call(this.players);
        this.playerRemoveListener.call(player, this.players);
    }

    private generateSessionKey(): string {
        return crypto.randomUUID();
    }
}
