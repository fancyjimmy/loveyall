import type ServerSocketHandler from "./ServerSocketHandler";
import type {Server, Socket} from "socket.io";
import type {TypedServerHandler} from "./types";
import type NamespaceHandler from "./NamespaceHandler";


type ServerListener<T> = {
    [key: string]: {
        [socketId: string]: (data: T, socket: Socket, io: Server) => void
    }
}


export class ServerHandler<T> implements ServerSocketHandler {

    private listeners: ServerListener<any> = {};

    registerSocket(io: Server, socket: Socket) {
        const specificEvents = ["disconnect", "disconnecting", "connect"];
        for (let key in this.handler) {
            let realKey = `${this.nameSpace}:${key}`;
            if (specificEvents.includes(key)) {
                realKey = `${key}`;
            }
            // Doesn't work with Acknowledgements or multiple params.
            // to do that data needs to be replaced with ...args, but then it's not type safe anymore
            const listener = (...data: any[]) => {
                try {
                    if (data.length <= 1) {
                        return this.handler[key](data[0] ?? null, socket, io);
                    }
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

    registerForEverySocket(io: Server) {
        io.sockets.sockets.forEach(socket => this.registerSocket(io, socket));
    }

    unregister(socket: Socket) {
        for (let key in this.listeners) {
            try {
                socket.off(key, this.listeners[key][socket.id]);
            } catch (e) {
                console.error(e);
            }
        }
    }

    registerNamespaceHandler<T>(io: Server, namespace: string, namespaceHandler: NamespaceHandler<T>) {
        const namespaceConnection = io.of(namespace);
        namespaceConnection.on("connection", socket => namespaceHandler.registerSocket(namespaceConnection, socket));
    }


    protected handler: TypedServerHandler<T>;
    protected nameSpace: string;

    constructor(nameSpace: string, handler: TypedServerHandler<T>) {
        this.handler = handler;
        this.nameSpace = nameSpace;
    }
}