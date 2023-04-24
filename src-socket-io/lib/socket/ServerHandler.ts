import NamespaceHandler from './NamespaceHandler';
import type {Namespace, Server, Socket} from 'socket.io';
import type {TypedNamespaceHandler} from './types';
import type {DefaultEventsMap, EventsMap} from "socket.io/dist/typed-events";

export class ServerHandler<THandler, TSocketData = any,
    TListenEvents extends EventsMap = DefaultEventsMap,
    TEmitEvents extends EventsMap = DefaultEventsMap,
    TServerSideEvents extends EventsMap = DefaultEventsMap,
> extends NamespaceHandler<THandler, TSocketData, TListenEvents, TEmitEvents, TServerSideEvents> {
    constructor(public readonly prefix: string, io: Server, handler: TypedNamespaceHandler<THandler, TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>) {
        super('/', io, handler);
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
            if (key === 'disconnect') {
                socket.on('disconnect', listener);
            } else {
                socket.on(this.prefix + ':' + key.toString(), listener);
            }
        }
    }
}
