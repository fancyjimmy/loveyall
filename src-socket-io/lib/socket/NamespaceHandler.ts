import type {Namespace, Server, Socket} from 'socket.io';
import type {TypedNamespaceHandler} from './types';
import type {DefaultEventsMap, EventsMap} from 'socket.io/dist/typed-events';

type NamespaceListener<T> = {
    [key: string]: {
        [socketId: string]: (data: T, socket: Socket, io: Namespace) => void;
    };
};

export default abstract class NamespaceHandler<
    THandler,
    TSocketData extends any,
    TListenEvents extends EventsMap = DefaultEventsMap,
    TEmitEvents extends EventsMap = DefaultEventsMap,
    TServerSideEvents extends EventsMap = DefaultEventsMap
> {
    protected handler: TypedNamespaceHandler<THandler, TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>;
    protected readonly io: Server<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>;

    register() {
        this.namespace.on('connection', (socket) => this.registerSocket(this.namespace, socket));
    }

    protected constructor(
        namespaceName: string,
        io: Server<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>,
        handler: TypedNamespaceHandler<THandler, TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>
    ) {
        this.handler = handler;
        this.namespaceName = namespaceName;
        this.io = io;
    }

    registerSocket(io: Namespace, socket: Socket) {
        for (let key in this.handler) {
            const listener = (...data: any[]) => {
                try {
                    if (data.length <= 1) return this.handler[key](data[0] ?? null, socket, io);
                    return this.handler[key](data as any, socket, io);
                } catch (e) {
                    console.error(e);
                }
            };
            if (key === 'connect') {
                try {
                    listener(null, socket, io);
                } catch (e) {
                    console.error(e);
                }
                continue;
            }
            socket.on(key.toString(), listener);
        }
    }
    public readonly namespaceName: string;

    /**
     * Unregister all listeners for a socket
     *
     * @param close if true, >the socket will be disconnected and can't be used anymore
     */
    unregister(close: boolean) {
        this.namespace.disconnectSockets(close);
    }

    get namespace(): Namespace {
        return this.io.of(this.namespaceName);
    }

    remove() {
        this.io._nsps.delete(this.namespaceName);
        this.io.of(this.namespaceName).local.disconnectSockets(true);
    }
}
