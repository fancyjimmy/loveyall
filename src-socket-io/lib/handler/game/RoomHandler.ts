import type {TypedNamespaceHandler} from "../../socket/types";
import type {Namespace, Server, Socket} from "socket.io";

type SocketEventListener = {
    socket: Socket;
    events: {
        [event: string]: (...args: any[]) => void;
    }
}

/*
Use:

 */
export class RoomHandler<Events> {
    constructor(public readonly roomName: string, protected readonly io: Namespace | Server, private readonly handler: TypedNamespaceHandler<Events>) {
        this.io = io;
        this.handler = handler;
    }

    private sockets: Socket[] = [];

    join(sockets: Socket[]) {
        this.sockets = sockets;
        for (let socket of sockets) {
            socket.join(this.roomName);
        }
    }

    leave() {
        this.sockets.forEach(socket => socket.leave(this.roomName));
    }

}