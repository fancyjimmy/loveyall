import type {Namespace, Server, Socket} from "socket.io";
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

            let realKey = `${key}`;

            // Doesn't work with Acknowledgements or multiple params.
            // to do that data needs to be replaced with ...args, but then it's not type safe anymore
            const listener = (...data: any[]) => {
                try {
                    if (data.length <= 1)
                        return this.handler[key](data[0] ?? null, socket, io);
                    return this.handler[key](data as any, socket, io);
                } catch (e) {
                    console.error(e);
                }
            }

            if (key === "connect") {
                try {
                    listener(null, socket, io);
                } catch (e) {
                    console.error(e);
                }
                continue;
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

    remove(io: Server) {
        io._nsps.delete(this.namespaceName);
        io.of(this.namespaceName).local.disconnectSockets(true);
    }


    /**
     * Unregister all listeners for a socket
     *
     * @param socket
     * @param io
     * @param close if true, the socket will be disconnected and can't be used anymore
     */
    unregister(socket: Socket, io: Namespace, close: boolean) {
        for (let key in this.listeners) {
            try {
                socket.off(key, this.listeners[key][socket.id]);
            } catch (e) {
                console.error(e);
            }
        }
        io.disconnectSockets(close);
    }


    protected handler: TypedNamespaceHandler<T>;
    protected namespaceName: string;
    protected io: Server;

    get namespace(): Namespace {
        return this.io.of(this.namespaceName);
    }

    constructor(namespaceName: string, io: Server, handler: TypedNamespaceHandler<T>) {
        this.handler = handler;
        this.namespaceName = namespaceName;
        this.io = io;
    }
}