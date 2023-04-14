import {ServerHandler} from "../socket/ServerHandler";
import type {LobbyClientEvents, LobbyManagingEvents} from "./types";
import type {Server, Socket} from "socket.io";


type StringTyped = { [key: string]: any };

class Emitter<T extends StringTyped> {
    emit<K extends keyof T & string>(socket: Socket, event: K, data: T[K]): void {
        socket.emit(event, data);
    }

    broadcast<K extends keyof T & string>(io: Server, room: string, event: K, data: T[K]): void {
        io.to(room).emit(event, data);
    }

    broadcastAll<K extends keyof T & string>(io: Server, event: K, data: T[K]): void {
        io.emit(event, data);
    }
}


class LobbyManagerHandler extends ServerHandler<LobbyManagingEvents> {

    private readonly emitter = new Emitter<LobbyClientEvents>();

    constructor() {
        super("lobby", {
            create: (data, socket, io) => {
                this.emitter.emit(socket, "created", {lobbyId: "test"});
            },
            join: (data, socket) => {

            },
            leave: (data, socket) => {

            },
            disconnect: (data, socket) => {

            }
        });
    }
}