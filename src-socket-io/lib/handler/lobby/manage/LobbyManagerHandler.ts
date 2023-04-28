import type {Server} from 'socket.io';
import {type GeneralLobbyInfo, ZGeneralLobbyInfo, ZLobbyCreationSettings, ZLobbyJoinOption} from './types';
import {z} from 'zod';
import {createResponseSchema} from '../types';
import {LobbyHandler} from '../LobbyHandler';
import CheckedServerHandler from '../../../socket/CheckedServerHandler';

/*
Lobby Making Description

user sends a create request to the LobbyManagerHandler
LobbyManagerHandler creates a new LobbyHandler with a random generated ID
LobbyManager sends the ID back to the user

User will be redirected to the /lobby/[lobbyId] page
he can then join with a name and password
he can send a link with the lobbyId to his friends

any person can join the lobby with the lobbyId and the password
the person then can ask the LobbyManagerHandler to join the lobby
if they can join, they will get a sessionKey to authenticate themselves with it for the lobby


 */

/*


    private readonly lobbies: Map<string, LobbyHandler> = new Map();

    private count = 0;

    private generateLobbyId(): string {
        return crypto.randomUUID();
    }

    private createLobby(io: Server, lobbySettings: LobbySetting, timeoutTime: TimerOptions): LobbyHandler {
        const lobby = new LobbyHandler(io, this.generateLobbyId(), lobbySettings, timeoutTime);
        return lobby;
    }

    public instantiateLobby(io: Server, lobbySettings: LobbySetting, timeoutTime: TimerOptions): LobbyHandler {
        const lobby = this.createLobby(io, lobbySettings, timeoutTime);
        this.lobbies.set(lobby.lobbyId, lobby);

        console.log(this.lobbies.keys());


        lobby.inactivityTimer.onTimeout(() => {
            lobby.stop();
            console.log("lobby should be stopped");
        });
        lobby.onStop(() => {
            lobby.unregister(true);
            this.lobbies.delete(lobby.lobbyId);
        });
        lobby.start(io);
        return lobby;
    }


    constructor() {
        super("lobby", {
            create: (data, socket, io) => {
                const [{settings}, cb] = data;

                if (settings.isPrivate && !settings.password) {
                    cb({data: null, success: false, message: "Password is required"});
                    return;
                }

                let chatRoomId: string = crypto.randomUUID();
                const serverChat = new ServerChatHandler(io, chatRoomId, false);
                serverChat.register();


                const lobby = this.instantiateLobby(io, {...settings, chatRoomId}, {minutes: 5});
                serverChat.whenMessage((message, socket, chatuser) => {
                    if (message.startsWith("/disconnect")) {
                        socket.disconnect(true);
                        serverChat.broadcastMessage(`${chatuser.name} disconnected`, "Server", {server: true});
                    }
                });
                const chatGameManager = new ChatGameManager(serverChat);

                chatGameManager.addChatGame((message, user, info) => {
                    if (message.startsWith("test")) {
                        return true;
                    }
                    return false;
                }, new TestChatGame(serverChat), false);

                chatGameManager.addChatGame((message, user, info) => {
                    if (message.startsWith("/hangman")) {
                        return true;
                    }
                    return false;
                }, new Hangman(serverChat), false);


                lobby.onStop(() => {
                    serverChat.closeRoom();
                });
                cb({
                    data: lobby.lobbyId, success: true, message: "Lobby created"
                });

            },
            join: ([{lobbyId, username, password}, response], socket) => {
                const lobby = this.getLobbyFromId(lobbyId);
                if (!lobby) {
                    response({message: "Lobby not found", success: false, data: null});
                    return;
                }

                try {
                    const playerInfo = lobby.tryJoin(socket, username, password);
                    response({message: "", success: true, data: playerInfo});
                } catch (e) {
                    if (e instanceof Error) {
                        response({message: e.message, success: false, data: null});
                        return;
                    }
                    response({message: JSON.stringify(e), success: false, data: null});
                }
            },
            get: ([{lobbyId}, response]) => {
                const lobby = this.getLobbyFromId(lobbyId);
                if (!lobby) {
                    response({message: "Lobby not found", success: false, data: null});
                    return;
                }
                response({message: "", success: true, data: {isPrivate: lobby.settings.isPrivate}});
            },
            getAll: (response) => {
                response({
                    success: true,
                    message: "",
                    data: this.getPublicLobbies()
                });
            }
        });

    }

    getPublicLobbies(): LobbyClientInfo[] {
        let lobbies: LobbyClientInfo[] = [];
        for (let lobby of this.lobbies.values()) {
            if (!lobby.settings.isPrivate) {
                lobbies.push({
                    lobbyId: lobby.lobbyId,
                    maxPlayers: lobby.settings.maxPlayers,
                    playerNumber: lobby.playerNumber
                });
            }

        }

        return lobbies;

    }

    getLobbyFromId(lobbyId: string): LobbyHandler | undefined {
        return this.lobbies.get(lobbyId);
    }
}

 */

export const ZLobbyManagingEvents = z.object({
	create: z.tuple([ZLobbyCreationSettings, createResponseSchema(ZGeneralLobbyInfo)]),
	join: z.tuple([ZLobbyJoinOption, createResponseSchema(z.string().nonempty())]),
	get: z.tuple([
		z.object({
			lobbyId: z.string()
		}),
		createResponseSchema(ZGeneralLobbyInfo)
	]),
	getAll: z.function().args(z.array(ZGeneralLobbyInfo)).returns(z.void())
});

export type LobbyManagingEvents = z.infer<typeof ZLobbyManagingEvents>;

export default class LobbyManagerHandler extends CheckedServerHandler<typeof ZLobbyManagingEvents, any> {
	private lobbyMap: Map<string, LobbyHandler> = new Map();

	constructor(io: Server) {
		super(
			'lobby',
			io,
			ZLobbyManagingEvents,
			{
				create: ([settings, cb], socket, io) => {
					const id = this.createLobbyId();

					const lobby = new LobbyHandler(this.io, id, settings);
					this.lobbyMap.set(id, lobby);
					lobby.start();
					cb({
						data: lobby.generalInfo,
						success: true,
						message: 'Lobby created'
					});
				},
				join: ([joinOptions, cb], socket, io) => {
					const lobbyId = joinOptions.lobbyId;
					const lobby = this.lobbyMap.get(lobbyId);
					if (!lobby) {
						cb({ message: 'Lobby not found', success: false });
						return;
					}

					const joined = lobby.join(joinOptions);

					if (!joined) {
						cb({ message: 'Could not join', success: false });
						return;
					} else {
						cb({ success: true, data: joined.sessionKey });
						return;
					}
				},
				get: ([{ lobbyId }, callback], socket, io) => {
					const lobby = this.lobbyMap.get(lobbyId);
					if (!lobby) {
						callback({ message: 'Lobby not found', success: false });
						return;
					} else {
						callback({ message: '', success: true, data: lobby.generalInfo });
					}
				},
				getAll: (callback, socket, io) => {
					callback(this.getAllPublicLobbies());
				}
			},
			{
				onClientError: (error, socket, io) => {
					console.error(error);
					socket.emit('error', { message: error.message });
				}
			}
		);
	}

	getAllLobbies(): GeneralLobbyInfo[] {
		return Array.from(this.lobbyMap.values()).map((lobby) => lobby.generalInfo);
	}

	getAllPublicLobbies(): GeneralLobbyInfo[] {
		return this.getAllLobbies().filter((lobby) => !lobby.isPrivate);
	}

	private createLobbyId(): string {
		return crypto.randomUUID();
	}
}
