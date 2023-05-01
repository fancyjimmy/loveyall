import { LobbyRole, type PlayerInfo } from '../types';
import type { LobbyJoinOption } from '../manage/types';
import ClientError from '../../../ClientError';
import type { Socket } from 'socket.io';
import PlayerTimeoutPolicy from '../policy/time/player/PlayerTimeoutPolicy';
import { Listener } from '../../../utilities/Listener';
import * as crypto from 'crypto';
import type { RolePolicy } from '../policy/role';
import Player from './Player';

type PlayerExtraData = {
	timeout: PlayerTimeoutPolicy;
	socketId: string | null;
};
export default class PlayerManager {
	private playerMap: Map<PlayerInfo, PlayerExtraData> = new Map<PlayerInfo, PlayerExtraData>();

	#players: Player[] = [];
	private playerRemoveListener = new Listener<
		(player: PlayerInfo, players: PlayerInfo[]) => void
	>();
	private playerChangeListener = new Listener<(players: PlayerInfo[]) => void>();
	private playerAddListener = new Listener<(player: PlayerInfo, players: PlayerInfo[]) => void>();

	get players(): Player[] {
		return [...this.#players];
	}

	constructor(
		public readonly maxPlayers: number,
		public readonly rolePolicy: RolePolicy,
		private readonly milliseconds: number = 1000 * 60 * 5
	) {
		this.playerRemoveListener.addListener((player, players) => {
			console.log(player);
		});
		this.playerChangeListener.addListener((players) => {
			console.log(players.length);
		});

		this.playerAddListener.addListener((player, players) => {
			console.log(player);
		});
	}

	public get playerInfos(): PlayerInfo[] {
		return this.#players.map((player) => player.playerInfo);
	}

	removePlayerBySocket(socket: Socket) {
		const playerInfo = this.getPlayerInfo(socket.handshake.auth.token);
		if (!playerInfo) {
			return;
		}
		this.deletePlayer(playerInfo);
	}

	bindPlayerToSocket(socket: Socket) {
		const player = this.getPlayerBySession(socket.handshake.auth.token);
		if (!player) {
			// not found by session storage
			throw new ClientError('Player not found');
		}

		console.log('bind  ' + player.playerInfo.username);
		if (player.isConnected) {
			throw new ClientError('Player already connected');
		}

		player.updateSocket(socket);

		socket.data = {
			player: player.playerInfo
		};
	}

	getPlayerInfo(token: string): PlayerInfo | undefined {
		return this.playerInfos.find((player) => player.sessionKey === token);
	}

	createPlayer(joinOptions: LobbyJoinOption) {
		if (this.playerInfos.length >= this.maxPlayers) {
			throw new ClientError('Max players reached');
		}

		const playerInfo = this.generatePlayerInfo(joinOptions);
		const playerTimeoutPolicy = new PlayerTimeoutPolicy(this.milliseconds);

		const player = new Player(playerTimeoutPolicy, playerInfo, null);
		this.#players.push(player);

		player.onTimeout(() => {
			this.deletePlayer(player.playerInfo);
		});

		this.playerChangeListener.call(this.playerInfos);
		this.playerAddListener.call(playerInfo, this.playerInfos);
		return playerInfo;
	}

	/**
	 * kicks a player from the lobby
	 * returns the socket id of the kicked player
	 * returns null if the player was not connected with a socket (happens when he reloads the page)
	 * @param host
	 * @param name
	 */
	tryKickPlayer(host: PlayerInfo, name: string): string | null {
		if (host.role !== LobbyRole.HOST) {
			// happens when somebody calls the kick method as a player
			// should be prevented by front end
			throw new ClientError('Only host can kick');
		}

		const kicked = this.playerInfos.find((player) => player.username === name);
		if (!kicked) {
			// happens when you try to kick a player with an unknown name
			throw new ClientError('Player not found');
		}
		const socketId = this.playerMap.get(kicked)!.socketId;
		this.deletePlayer(kicked);
		return socketId;
	}

	getPlayerBySession(session: string): Player | undefined {
		return this.#players.find((player) => player.playerInfo.sessionKey === session);
	}

	getPlayerFromSocket(socket: Socket): Player | undefined {
		const player = this.#players.find((player) => player.socket?.id === socket.id);
		return player;
	}

	unbindPlayerFromSocket(socket: Socket<{ player: PlayerInfo }>) {
		const player = this.getPlayerFromSocket(socket);
		if (player === null) {
			throw new ClientError(
				"Player isn't connected to socket, event though it passed the connection"
			);
		}
		player?.updateSocket(null);
		delete socket.data.player;
	}

	getPlayerInfos(): PlayerInfo[] {
		return this.playerInfos;
	}

	getHost(): Player | null {
		return this.#players.find((player) => player.playerInfo.role === LobbyRole.HOST) ?? null;
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

	private generatePlayerInfo(joinOptions: LobbyJoinOption) {
		const sessionKey = this.generateSessionKey();

		const role = this.playerInfos.length === 0 ? LobbyRole.HOST : LobbyRole.PLAYER;
		const username = this.getUniqueUsername(joinOptions.username);
		const playerInfo: PlayerInfo = {
			username: username,
			role: role,
			joinedTime: new Date(),
			sessionKey
		};

		return playerInfo;
	}

	getSocket(player: PlayerInfo) {
		return this.playerMap.get(player)?.socketId ?? null;
	}

	private generateSessionKey(): string {
		return crypto.randomUUID();
	}

	private getUniqueUsername(username: string): string {
		let count = 1;
		let newUsername = username;
		const infos = this.playerInfos;
		while (infos.map((player) => player.username).includes(newUsername)) {
			newUsername = `${username}#${count++}`;
		}
		return newUsername;
	}

	private deletePlayer(playerInfo: PlayerInfo) {
		this.rolePolicy.setNextHost(this.#players, playerInfo);
		this.#players = this.#players.filter((p) => p.playerInfo !== playerInfo);
		this.playerChangeListener.call(this.playerInfos);
		this.playerRemoveListener.call(playerInfo, this.playerInfos);
	}
}
