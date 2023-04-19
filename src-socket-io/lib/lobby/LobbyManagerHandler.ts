import {ServerHandler} from "../socket/ServerHandler";
import type {LobbyClientInfo, LobbyManagingEvents, LobbySettings} from "./types";
import type {Namespace, Server, Socket} from "socket.io";
import {LobbyHandler} from "./LobbyHandler";
import type {TimerOptions} from "./TimeoutPolicy";
import {ServerChatHandler} from "../chat";
import {ChatGameManager} from "./chatGame/ChatGameManager";
import {TestChatGame} from "./chatGame/example/TestChatGame";
import {Hangman} from "./chatGame/example/Hangman";


type StringTyped = { [key: string]: any };

export class Emitter<T extends StringTyped> {
    emit<K extends keyof T & string>(socket: Socket, event: K, data: T[K]): void {
        socket.emit(event, data);
    }

    broadcast<K extends keyof T & string>(io: Server | Namespace, room: string, event: K, data: T[K]): void {
        io.to(room).emit(event, data);
    }

    broadcastAll<K extends keyof T & string>(io: Server | Namespace, event: K, data: T[K]): void {
        io.emit(event, data);
    }
}

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


export class LobbyManagerHandler extends ServerHandler<LobbyManagingEvents> {

    private readonly lobbies: Map<string, LobbyHandler> = new Map();

    private count = 0;

    private generateLobbyId(): string {
        return crypto.randomUUID();
    }

    private createLobby(io: Server, lobbySettings: LobbySettings, timeoutTime: TimerOptions): LobbyHandler {
        const lobby = new LobbyHandler(io, this.generateLobbyId(), lobbySettings, timeoutTime);
        return lobby;
    }

    public instantiateLobby(io: Server, lobbySettings: LobbySettings, timeoutTime: TimerOptions): LobbyHandler {
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
                serverChat.registerForEverySocket();


                const lobby = this.instantiateLobby(io, {...settings, chatRoomId}, {minutes: 5});
                serverChat.whenMessage((message, socket, chatuser) => {
                    lobby.inactivityTimer.resetTimer();
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