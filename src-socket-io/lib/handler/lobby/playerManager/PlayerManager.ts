import {LobbyRole, type PlayerInfo} from '../types';
import type {LobbyJoinOption} from '../manage/types';
import ClientError from '../../../ClientError';
import type {Socket} from "socket.io";

export default class PlayerManager {
    private playerMap: Map<PlayerInfo, string | null> = new Map<PlayerInfo, string | null>();

    constructor(public readonly maxPlayers: number) {
    }

    private get players(): PlayerInfo[] {
        return Array.from(this.playerMap.keys());
    }

    removePlayer(socket: Socket) {
        const player = this.getPlayer(socket.handshake.auth.token);
        if (!player) {
            return;
        }
        this.playerMap.delete(player);
    }

    getPlayer(token: string): PlayerInfo | undefined {
        return this.players.find((player) => player.sessionKey === token);
    }

    bindPlayerFromSocket(socket: Socket) {
        const player = this.getPlayer(socket.handshake.auth.token);
        if (!player) {
            throw new ClientError('Player not found');
        }
        if (this.playerMap.get(player) !== null) {
            throw new ClientError('Already online');
        }

        socket.data = {
            player: player
        };
        this.playerMap.set(player, socket.id);
    }

    addPlayer(joinOptions: LobbyJoinOption) {
        if (this.players.length >= this.maxPlayers - 1) {
            throw new ClientError('Max players reached');
        }
        const sessionKey = this.generateSessionKey();

        const role = this.players.length === 0 ? LobbyRole.HOST : LobbyRole.PLAYER;
        const player: PlayerInfo = {
            username: joinOptions.username,
            role: role,
            joinedTime: new Date(),
            sessionKey
        };
        this.playerMap.set(player, null);

        console.log(this.players);
        return player;
    }

    getPlayers(): PlayerInfo[] {
        return this.players;
    }

    unbindPlayerFromSocket(socket: Socket<{ player: PlayerInfo }>) {
        if ((this.playerMap.get(socket.data.player) ?? null) === null) {
            throw new Error('Player isn\'t connected to socket, event though it passed the connection');
        }
        this.playerMap.set(socket.data.player, null);
    }

    private generateSessionKey(): string {
        return crypto.randomUUID();
    }
}
