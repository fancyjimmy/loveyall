import type {Namespace, Socket} from "socket.io";
import type {TypedNamespaceHandler} from "./types";
import type NamespaceSocketHandler from "./NamespaceSocketHandler";


type NamespaceListener<T> = {
    [key: string]: {
        [socketId: string]: (data: T, socket: Socket, io: Namespace) => void
    }
}


export default class NamespaceHandler<T> implements NamespaceSocketHandler {

    private listeners: NamespaceListener<any> = {};

    registerSocket(io: Namespace, socket: Socket) {
        const specificEvents = ["disconnect", "disconnecting"];
        for (let key in this.handler) {
            let realKey = `${this.nameSpace}:${key}`;
            if (specificEvents.includes(key)) {
                realKey = `${key}`;
            }
            // Doesn't work with Acknowledgements or multiple params.
            // to do that data needs to be replaced with ...args, but then it's not type safe anymore
            const listener = (data: any) => {
                return this.handler[key](data, socket, io);
            }

            socket.on(realKey, listener);
            if (!this.listeners[realKey]) {
                this.listeners[realKey] = {};
            }

            this.listeners[realKey][socket.id] = listener;
        }
    }

    registerForEverySocket(io: Namespace) {
        io.sockets.forEach(socket => this.registerSocket(io, socket));
    }

    unregister(socket: Socket, io: Namespace) {
        for (let key in this.listeners) {
            try {
                socket.off(key, this.listeners[key][socket.id]);
            } catch (e) {
                console.error(e);
            }
        }

        io.disconnectSockets(true);

    }


    protected handler: TypedNamespaceHandler<T>;
    protected nameSpace: string;

    constructor(nameSpace: string, handler: TypedNamespaceHandler<T>) {
        this.handler = handler;
        this.nameSpace = nameSpace;
    }
}