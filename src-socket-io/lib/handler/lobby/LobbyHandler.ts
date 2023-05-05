import CheckedNamespaceHandler from '../../socket/CheckedNamespaceHandler';
import type { Server } from 'socket.io';
import {
	createResponseSchema,
	type LobbyClientEventFunctions,
	type PlayerInfo,
	PlayerState,
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
import type Game from '../game/Game';
import { Listener } from '../../utilities/Listener';

export function playerInfoToGeneralPlayerInfo(player: PlayerInfo): Omit<PlayerInfo, 'sessionKey'> {
	return {
		username: player.username,
		role: player.role,
		joinedTime: player.joinedTime
	};
}

export type JoinInfo = z.infer<typeof ZJoinInfo>;

type LobbyState = 'lobby' | 'game-initializing' | 'game-running';
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
	private gameInitializer: GameInitializer<any> | null = null;
	private gameManager: GameManager = new GameManager();

	private game: Game | null = null;
	private endListener = new Listener();

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
						players: this.playerManager.getPlayerInfos().map(playerInfoToGeneralPlayerInfo),
						name: this.lobbySettings.name,
						maxPlayers: this.lobbySettings.maxPlayers,
						authenticationPolicy: this.lobbySettings.authenticationPolicy,
						game: this.gameInitializer?.name ?? null,
						state:
							this.playerManager.getPlayerFromSocket(socket)?.getGameState() ?? PlayerState.LOBBY
					});
				},
				changeSettings: (data, io) => {},
				leave: (callback, socket) => {
					this.playerManager.removePlayerBySocket(socket);
					callback();
					socket.disconnect();
				},
				get: (data, socket, io) => {},
				ping: (cb) => {
					cb();
				},
				start: ([game, cb], socket) => {
					if (!(socket.data?.player?.role === 'host')) {
						cb({ message: 'You are not the host', success: false });
						return;
					}

					if (this.gameInitializing || this.gameRunning) {
						cb({ message: 'Game already running', success: false });
						return;
					}

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
						this.playerManager.bindPlayerToSocket(socket);
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
		this.timeoutPolicy = new DefaultLobbyTimeoutPolicy({ minutes: 1 });
		this.timeoutPolicy.onTimeout(() => {
			this.stop();
		});

		this.timeoutPolicy.trigger('lobbyCreated', undefined);

		this.playerManager.onPlayerRemove((player, players) => {
			this.timeoutPolicy.trigger('playerLeave', players.length);
			console.log('player left');
		});

		this.playerManager.onPlayerAdd((player, players) => {
			this.timeoutPolicy.trigger('playerJoined', players.length);
			console.log('player joined');
		});

		this.timeoutPolicy.onTimeout(() => {
			console.log('lobby timed out');
		});
		this.authenticationPolicy = AuthenticationPolicyFactory.getAuthenticationPolicy(settings);

		this.gameManager.addGame(new SharedPixelCanvasInitializer(this));
		this.mountChatManager();
		this.startPlayerChangeEvents();
	}

	public get gameRunning(): boolean {
		return this.game !== null;
	}

	public get gameInitializing(): boolean {
		return this.gameInitializer !== null;
	}

	public get gameState(): LobbyState {
		if (this.gameRunning) {
			return 'game-running';
		} else if (this.gameInitializing) {
			return 'game-initializing';
		} else {
			return 'lobby';
		}
	}

	get playerInfos(): PlayerInfo[] {
		return this.playerManager.getPlayerInfos();
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
			return this.playerManager.createPlayer(lobbyJoinOption);
		}
		return null;
	}

	get generalInfo(): GeneralLobbyInfo {
		return {
			lobbyId: this.lobbyId,
			name: this.lobbySettings.name,
			maxPlayers: this.lobbySettings.maxPlayers,
			isPrivate: this.lobbySettings.isPrivate,
			authenticationPolicyType: this.lobbySettings.authenticationPolicy.name,
			playerCount: this.playerInfos.length,
			game: this.gameInitializer?.name ?? null
		};
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

	public stop() {
		this.chatHandler.remove();
		this.endListener.call();
		this.remove();
	}

	onEnd(callback: () => void) {
		this.endListener.addListener(callback);
	}

	private async chooseGame(gameInitializer: GameInitializer<any>) {
		this.gameInitializer = gameInitializer;
		this.namespace.emit('game-chosen', {
			url: this.gameInitializer.name
		});

		const players = this.playerManager.players;
		try {
			players.forEach((player) => {
				player.setGameState(PlayerState.INITIALIZING);
			});
			const config = await this.gameInitializer.loadGameConfig(
				players,
				this.playerManager.getHost()
			);

			this.namespace.emit('game-started');
			players.forEach((player) => {
				player.setGameState(PlayerState.PLAYING);
			});
			this.game = await this.gameInitializer.startGame(this, players, config);
			this.game!.onEnd(() => {
				this.game = null;
				this.gameInitializer = null;
				this.namespace.emit('game-ended');
			});
		} catch (e) {
			if (e === 'cancelled') {
				this.gameInitializer = null;
				this.game = null;
				this.namespace.emit('game-canceled');
				players.forEach((player) => {
					player.setGameState(PlayerState.LOBBY);
				});
			} else if (e instanceof ClientError) {
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
