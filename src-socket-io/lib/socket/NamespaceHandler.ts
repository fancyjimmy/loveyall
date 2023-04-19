import type {Namespace, Server, Socket} from "socket.io";
import type {TypedNamespaceHandler} from "./types";


type NamespaceListener<T> = {
    [key: string]: {
        [socketId: string]: (data: T, socket: Socket, io: Namespace) => void
    }
}


export default abstract class NamespaceHandler<T> {
    registerSocket(io: Namespace, socket: Socket) {
        for (let key in this.handler) {
            let realKey = `${key}`;
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
        }
    }

    protected constructor(namespaceName: string, io: Server, handler: TypedNamespaceHandler<T>) {
        this.handler = handler;
        this.namespaceName = namespaceName;
        this.io = io;
    }

    register() {
        this.namespace.on('connection', (socket) => this.registerSocket(this.namespace, socket));
    }


    /**
     * Unregister all listeners for a socket
     *
     * @param close if true, the socket will be disconnected and can't be used anymore
     */
    unregister(close: boolean) {
        this.namespace.disconnectSockets(close);
    }


    protected handler: TypedNamespaceHandler<T>;
    public readonly namespaceName: string;
    protected io: Server;

    get namespace(): Namespace {
        return this.io.of(this.namespaceName);
    }

    remove() {
        this.io._nsps.delete(this.namespaceName);
        this.io.of(this.namespaceName).local.disconnectSockets(true);
    }
}