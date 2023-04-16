import NamespaceHandler from '../socket/NamespaceHandler';
import {Lobby} from './Lobby';
import type {
    LobbyClientEvents,
    LobbyInfo,
    LobbyRole,
    LobbySettings,
    Player,
    PlayerAuthenticationResponse,
    PlayerInfo,
    Response
} from './types';
import {DefaultTimer, type Timer, type TimerOptions} from './TimeoutPolicy';
import type {Server, Socket} from 'socket.io';
import type {TypedNamespaceHandler} from '../socket/types';
import {Emitter} from './LobbyManagerHandler';

export type LobbyEvents = {
    joined: (
        response: Response<{
            lobbyInfo: LobbyInfo;
            username: string;
            role: LobbyRole;
            players: PlayerInfo[];
        }>
    ) => void;
    changeSettings: {
        settings: Partial<LobbySettings>;
    };
    leave: null;
    rejoin:
        (response: Response<PlayerInfo>) => void;
    get: (response: Response<PlayerInfo>) => void;
    ping: () => void;
    disconnect: null;
    kick: {
        username: string;
    };

    connect: null;
};

function playerToPlayerInfo(player: Player): PlayerInfo {
    return {
        username: player.username,
        role: player.role,
        joinedTime: player.joinedTime
    };
}

function preAuthenticate<T>(
    typedNamespaceHandler: TypedNamespaceHandler<T>,
    authenticate: (socket: Socket) => boolean,
    onAuthenticationFail: (event: string, socket: Socket) => void
): TypedNamespaceHandler<T> {
    for (let key in typedNamespaceHandler) {
        const original = typedNamespaceHandler[key];
        typedNamespaceHandler[key] = (data, socket, io) => {
            if (authenticate(socket)) {
                original(data, socket, io);
            } else {
                onAuthenticationFail(key, socket);
            }
        };
    }
    return typedNamespaceHandler;
}

export class LobbyHandler extends NamespaceHandler<LobbyEvents> {
    private lobby: Lobby;
    public readonly inactivityTimer: Timer;
    private emitter: Emitter<LobbyClientEvents> = new Emitter<LobbyClientEvents>();

    constructor(
        io: Server,
        public readonly lobbyId: string,
        public readonly lobbySetting: LobbySettings,
        timeoutTime: TimerOptions
    ) {
        super(
            `/lobby/${lobbyId}`,
            io,
            preAuthenticate<LobbyEvents>(
                {
                    joined: (response, socket) => {
                        let user = this.lobby.getPlayerBySessionKey(socket.handshake.auth.token)!;
                        response({
                            message: '',
                            success: true,
                            data: {
                                username: user.username,
                                lobbyInfo: this.lobby.lobbyInfo,
                                role: user.role,
                                players: this.lobby.players.map(playerToPlayerInfo)
                            }
                        });
                    },
                    kick: ({username}, socket) => {
                        if (this.lobby.isHost(socket)) {
                            this.lobby.kick(username);
                        }
                    },
                    changeSettings: ({settings}, socket) => {
                        this.clientActivity();
                        console.log(settings);
                    },
                    leave: (data, socket) => {
                        this.lobby.leave(socket);
                    },
                    rejoin: (response, socket) => {
                        try {
                            let data = {...this.lobby.tryReconnect(socket, socket.handshake.auth.token)};
                            response({
                                message: '',
                                success: true,
                                data: {
                                    username: data.username,
                                    role: data.role,
                                    joinedTime: data.joinedTime
                                }
                            });
                        } catch (e) {
                            if (e instanceof Error) response({message: e.message, success: false, data: null});
                            return;
                        }
                    },
                    get: (response, socket) => {
                        let user = this.lobby.getPlayerBySessionKey(socket.handshake.auth.token);
                        if (user) {
                            response({
                                message: '',
                                success: true,
                                data: {username: user.username, role: user.role, joinedTime: user.joinedTime}
                            });
                        }
                    },
                    ping: (response, socket) => {
                        response();
                    },
                    disconnect: (data, socket) => {
                        console.log(socket.handshake.auth);
                        this.lobby.waitForReconnect(socket, 5000);
                    },
                    connect: (data, socket) => {
                        let user = this.lobby.getPlayerBySessionKey(socket.handshake.auth.token)!;
                        this.emitter.emit(socket, 'joined', {
                            lobbyInfo: this.lobby.lobbyInfo,
                            role: user.role,
                            players: this.lobby.players.map(playerToPlayerInfo)
                        });
                    }
                },
                (socket) => {
                    if (socket.handshake.auth.token === undefined) return false;
                    const token = socket.handshake.auth.token;
                    let user = this.lobby.getPlayerBySessionKey(token);
                    if (user) {
                        return true;
                    }
                    console.log("user", token);
                    return false;
                },
                (event, socket) => {
                    socket.emit('error', {
                        message: 'You are not authenticated to perform this action'
                    });
                }
            )
        );

        this.lobby = new Lobby({lobbyId, settings: this.lobbySetting});
        this.inactivityTimer = new DefaultTimer(timeoutTime); // TODO make this actually work liek intended
        this.lobby.lifeCycle.when('playerChanged', ({player, allPlayers, joined}) => {
            if (allPlayers.length === 0) {
                this.stop();
            }
            this.emitter.broadcastAll(this.namespace, 'playerChanged', {
                players: allPlayers.map(playerToPlayerInfo)
            });
        });
    }

    start(io: Server) {
        const namespace = io.of(this.namespaceName);
        namespace.on('connection', (socket) => {
            this.registerSocket(namespace, socket);
        });
        this.inactivityTimer.startTimer();
    }


    stop() {
        console.log(this.namespaceName + " stopping");
        this.stopCallBacks.forEach((cb) => cb());
        this.remove(this.io);
        this.inactivityTimer.stop();
    }

    joinAsHost(
        socket: Socket,
        username: string
    ): {
        username: string;
        sessionKey: string;
    } {
        return this.lobby.joinAsHost(socket, username);
    }

    tryJoin(socket: Socket, username: string, password: string): PlayerAuthenticationResponse {
        return this.lobby.tryJoin(socket, username, password);
    }

    activityCallbacks: (() => void)[] = [];

    clientActivity() {
        this.activityCallbacks.forEach((cb) => cb());
    }

    get settings(): LobbySettings {
        return this.lobby.lobbyInfo.settings;
    }

    onActivity(cb: () => void) {
        this.activityCallbacks.push(cb);
    }

    private stopCallBacks: (() => void)[] = [];

    onStop(callback: () => void) {
        this.stopCallBacks.push(callback);
    }
}
