import CheckedNamespaceHandler from '../../socket/CheckedNamespaceHandler';
import type {Server} from 'socket.io';
import {
    createResponseSchema,
    type LobbyClientEventFunctions,
    type Player,
    type PlayerInfo,
    ZGeneralPlayerInfo,
    ZJoinInfo
} from './types';
import {z} from 'zod';
import {
    type GeneralLobbyInfo,
    type LobbyCreationSettings,
    type LobbyJoinOption,
    type LobbySettings,
    ZLobbyCreationSettings
} from './manage/types';
import type {LobbyTimeoutPolicy} from './policy/time';
import {DefaultLobbyTimeoutPolicy} from './policy/time';
import {type AuthenticationPolicy, AuthenticationPolicyFactory} from './policy/authentication';
import type {RolePolicy} from './policy/role';
import {DefaultRolePolicy} from './policy/role';
import type {DefaultEventsMap} from 'socket.io/dist/typed-events';
import ClientError from '../../ClientError';
import {ServerChatHandler} from '../chat';
import * as crypto from 'crypto';
import PlayerManager from "./playerManager/PlayerManager";

export function playerInfoToGeneralPlayerInfo(player: PlayerInfo): Omit<PlayerInfo, 'sessionKey'> {
    return {
        username: player.username,
        role: player.role,
        joinedTime: player.joinedTime
    };
}

export const ZLobbyEvents = z.object({
    joined: z.function().args(ZJoinInfo).returns(z.void()),
    changeSettings: z.tuple([ZLobbyCreationSettings.partial(), createResponseSchema(z.void())]),
    leave: z.function().args(z.void()).returns(z.void()),
    get: z.function().args(createResponseSchema(ZGeneralPlayerInfo)).returns(z.void()),
    ping: z.function().args(z.void()).returns(z.void()),
    kick: z.tuple([z.string(), createResponseSchema(z.void())])
});

export class LobbyHandler extends CheckedNamespaceHandler<
    typeof ZLobbyEvents,
    { player: PlayerInfo },
    DefaultEventsMap,
    LobbyClientEventFunctions
> {
    public readonly lobbySettings: LobbySettings;
    public readonly chatHandler: ServerChatHandler;
    private timeoutPolicy: LobbyTimeoutPolicy;
    private authenticationPolicy: AuthenticationPolicy;
    private rolePolicy: RolePolicy;
    #chatRoomId: string | null = null;
    private playerManager: PlayerManager;

    constructor(io: Server, private lobbyId: string, settings: LobbyCreationSettings) {
        super(
            `lobby/${lobbyId}`,
            io,
            ZLobbyEvents,
            {
                joined: (callback, socket, io) => {
                    callback({
                        username: socket.data!.player!.username,
                        role: socket.data!.player!.role,
                        chatRoomId: this.chatRoomId,
                        isPrivate: this.lobbySettings.isPrivate,
                        lobbyId: this.lobbyId,
                        players: this.playerManager
                            .getPlayers()
                            .map(playerInfoToGeneralPlayerInfo),
                        name: this.lobbySettings.name,
                        maxPlayers: this.lobbySettings.maxPlayers,
                        authenticationPolicy: this.lobbySettings.authenticationPolicy
                    });
                },
                changeSettings: (data, socket, io) => {
                },
                leave: (callback, socket, io) => {
                    this.playerManager.removePlayer(socket);
                    callback();
                    socket.disconnect();
                },
                get: (data, socket, io) => {
                },
                ping: (cb, socket, io) => {
                    cb();
                },
                kick: (data, socket, io) => {
                }
            },
            {
                onClientError: (error, socket, io) => {
                    socket.emit('error', {message: error.message});
                },
                onServerError: (error, socket, io) => {
                    socket.emit('error', {message: 'Unknown Error'});
                    console.error(error);
                },
                onConnection: (socket, io) => {
                    // throws a client Error if the player is not authenticated
                    try {
                        this.playerManager.bindPlayerFromSocket(socket);
                    } catch (e) {
                        if (e instanceof ClientError) {
                            console.log(e);
                            socket.emit('error', {message: e.message});
                        } else {
                            console.error(e);
                            socket.emit('error', {message: 'Unknown Error'});
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
        this.lobbySettings = {...settings, chatRoomId: this.chatRoomId};
        this.timeoutPolicy = new DefaultLobbyTimeoutPolicy({minutes: 5});
        this.authenticationPolicy = AuthenticationPolicyFactory.getAuthenticationPolicy(settings);
    }

    get generalInfo(): GeneralLobbyInfo {
        return {
            lobbyId: this.lobbyId,
            name: this.lobbySettings.name,
            maxPlayers: this.lobbySettings.maxPlayers,
            isPrivate: this.lobbySettings.isPrivate,
            authenticationPolicyType: this.lobbySettings.authenticationPolicy.name,
        };
    };

    get players(): Player[] {
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
}
