import CheckedNamespaceHandler from '../../socket/CheckedNamespaceHandler';
import type { Server, Socket } from 'socket.io';
import {
	createResponseSchema,
	type LobbyClientEventFunctions,
	type PlayerInfo,
	ZGeneralPlayerInfo,
	ZJoinInfo
} from './types';
import { z } from 'zod';
import {
	type GeneralLobbyInfo,
	type LobbyCreationSettings,
	type LobbyJoinOption,
	type LobbySettings,
	ZLobbyCreationSettings
} from './manage/types';
import type { LobbyTimeoutPolicy } from './policy/time';
import { DefaultLobbyTimeoutPolicy } from './policy/time';
import { type AuthenticationPolicy, AuthenticationPolicyFactory } from './policy/authentication';
import type { RolePolicy } from './policy/role';
import { DefaultRolePolicy } from './policy/role';
import type { DefaultEventsMap } from 'socket.io/dist/typed-events';
import ClientError from '../../ClientError';
import { ServerChatHandler } from '../chat';
import * as crypto from 'crypto';
import PlayerManager from './playerManager/PlayerManager';
import { ChatGameManager } from './chatGame/ChatGameManager';
import Hangman from './chatGame/example/Hangman';
import type GameInitializer from '../game/GameInitializer';
import GameManager from '../game/GameManager';
import SharedPixelCanvasInitializer from '../game/example/sharedPixelCanvas/SharedPixelCanvasInitializer';

export function playerInfoToGeneralPlayerInfo(player: PlayerInfo): Omit<PlayerInfo, 'sessionKey'> {
	return {
		username: player.username,
		role: player.role,
		joinedTime: player.joinedTime
	};
}

export type JoinInfo = z.infer<typeof ZJoinInfo>;
export const ZLobbyEvents = z.object({
	joined: z.function().args(ZJoinInfo).returns(z.void()),
	changeSettings: z.tuple([ZLobbyCreationSettings.partial(), createResponseSchema(z.void())]),
	start: z.tuple([z.string(), createResponseSchema(z.void())]),
	leave: z.function().args(z.void()).returns(z.void()),
	get: z.function().args(createResponseSchema(ZGeneralPlayerInfo)).returns(z.void()),
	ping: z.function().args(z.void()).returns(z.void()),
	kick: z.tuple([z.string(), createResponseSchema(z.void())])
});

export default class LobbyHandler extends CheckedNamespaceHandler<
	typeof ZLobbyEvents,
	{ player: PlayerInfo },
	DefaultEventsMap,
	LobbyClientEventFunctions
> {
	public readonly lobbySettings: LobbySettings;
	public readonly chatHandler: ServerChatHandler;
	private timeoutPolicy: LobbyTimeoutPolicy;
	private authenticationPolicy: AuthenticationPolicy;
	private readonly rolePolicy: RolePolicy;
	#chatRoomId: string | null = null;
	private playerManager: PlayerManager;
	private game: GameInitializer<any> | null = null;
	private gameManager: GameManager = new GameManager();

	constructor(io: Server, private lobbyId: string, settings: LobbyCreationSettings) {
		super(
			`lobby/${lobbyId}`,
			io,
			ZLobbyEvents,
			{
				joined: (callback, socket) => {
					callback({
						username: socket.data!.player!.username,
						role: socket.data!.player!.role,
						chatRoomId: this.chatRoomId,
						isPrivate: this.lobbySettings.isPrivate,
						lobbyId: this.lobbyId,
						players: this.playerManager.getPlayers().map(playerInfoToGeneralPlayerInfo),
						name: this.lobbySettings.name,
						maxPlayers: this.lobbySettings.maxPlayers,
						authenticationPolicy: this.lobbySettings.authenticationPolicy
					});
				},
				changeSettings: (data, io) => {},
				leave: (callback, socket) => {
					this.playerManager.removePlayer(socket);
					callback();
					socket.disconnect();
				},
				get: (data, socket, io) => {},
				ping: (cb) => {
					cb();
				},
				start: ([game, cb]) => {
					// TODO Refactor and think about how to handle changes
					const initializer = this.gameManager.getGameInitializer(game);
					if (initializer) {
						this.chooseGame(initializer).then((_) => {
							cb({ success: true });
						});
					} else {
						cb({ message: 'Game not found', success: false });
					}
				},
				kick: async ([name, cb], socket, io) => {
					try {
						const kicked = this.playerManager.tryKickPlayer(socket.data.player!, name);
						if (kicked) {
							const kickedSocket = await io.in(kicked).fetchSockets();
							kickedSocket.forEach((socket) => socket.disconnect(true));
						}
						cb({ success: true });
					} catch (e) {
						if (e instanceof ClientError) {
							cb({ message: e.message, success: false });
						} else {
							throw e;
						}
					}
				}
			},
			{
				onClientError: (error, socket) => {
					socket.emit('error', { message: error.message });
				},
				onServerError: (error, socket, io) => {
					socket.emit('error', { message: 'Unknown Error' });
					console.error(error);
				},
				onConnection: (socket) => {
					// throws a client Error if the player is not authenticated
					try {
						this.playerManager.bindPlayerFromSocket(socket);
					} catch (e) {
						if (e instanceof ClientError) {
							console.log(e);
							socket.emit('error', { message: e.message });
						} else {
							console.error(e);
							socket.emit('error', { message: 'Unknown Error' });
						}
						return false;
					}
					return true;
				},
				onDisconnect: (socket, io) => {
					this.playerManager.unbindPlayerFromSocket(socket);
				}
			}
		);

		this.rolePolicy = new DefaultRolePolicy();
		this.playerManager = new PlayerManager(settings.maxPlayers, this.rolePolicy, 10 * 1000);
		this.chatHandler = new ServerChatHandler(io, this.chatRoomId, false);
		this.lobbySettings = { ...settings, chatRoomId: this.chatRoomId };
		this.timeoutPolicy = new DefaultLobbyTimeoutPolicy({ minutes: 5 });
		this.authenticationPolicy = AuthenticationPolicyFactory.getAuthenticationPolicy(settings);

		this.gameManager.addGame(new SharedPixelCanvasInitializer(this));
		this.mountChatManager();
		this.startPlayerChangeEvents();
	}

	get generalInfo(): GeneralLobbyInfo {
		return {
			lobbyId: this.lobbyId,
			name: this.lobbySettings.name,
			maxPlayers: this.lobbySettings.maxPlayers,
			isPrivate: this.lobbySettings.isPrivate,
			authenticationPolicyType: this.lobbySettings.authenticationPolicy.name,
			playerCount: this.players.length
		};
	}

	get players(): PlayerInfo[] {
		return this.playerManager.getPlayers();
	}

	private get chatRoomId(): string {
		if (this.#chatRoomId === null) {
			this.#chatRoomId = LobbyHandler.generateChatRoomId();
		}
		return this.#chatRoomId!;
	}

	private static generateChatRoomId(): string {
		return crypto.randomUUID();
	}

	/**
	 * gets used by the Lobby Manager to create a Player
	 * @param lobbyJoinOption
	 */
	public join(lobbyJoinOption: LobbyJoinOption) {
		if (this.authenticationPolicy.canJoin(lobbyJoinOption)) {
			return this.playerManager.addPlayer(lobbyJoinOption);
		}
		return null;
	}

	public stop() {
		this.chatHandler.remove();
		this.remove();
	}

	public start() {
		this.chatHandler.register();
		this.register();
	}

	private startPlayerChangeEvents() {
		this.playerManager.onPlayerChange((players) => {
			this.namespace.emit('playerChanged', {
				players: players.map(playerInfoToGeneralPlayerInfo)
			});
		});
	}

	socketFrom(player: PlayerInfo): Socket | null {
		const socketId = this.playerManager.getSocket(player);
		if (socketId === null) return null;
		return this.namespace.sockets.get(socketId) ?? null;
	}

	private mountChatManager() {
		this.chatHandler.whenMessage((message, socket, chatuser) => {
			if (message.startsWith('/disconnect')) {
				socket.disconnect(true);
				this.chatHandler.broadcastMessage(`${chatuser.name} disconnected`, 'Server', {
					server: true
				});
			}
		});
		const chatGameManager = new ChatGameManager(this.chatHandler);

		chatGameManager.addChatGame(
			(message, user, info) => {
				return message.startsWith('/hangman');
			},
			new Hangman(this.chatHandler),
			false
		);
	}

	private async chooseGame(gameInitializer: GameInitializer<any>) {
		// TODO refactor this

		this.game = gameInitializer;
		this.namespace.emit('game-chosen', {
			url: this.game.name
		});

		try {
			const config = await this.game.loadGameConfig(
				this.playerManager.getPlayers(),
				this.playerManager.getHost()
			);

			const game = await this.game.startGame(this, this.players, config);
		} catch (e) {
			if (e instanceof ClientError) {
				this.namespace.emit('error', {
					message: e.message
				});
			} else if (e instanceof Error) {
				console.error(e);
				this.namespace.emit('error', {
					message: e.message
				});
			}
		}
	}
}
