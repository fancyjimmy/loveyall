import type {Namespace, Server, Socket} from 'socket.io';

import type {CheckedNamespaceOption, TypedNamespaceHandler} from './types';
import NamespaceHandler from './NamespaceHandler';
import ClientError from '../ClientError';
import type {DefaultEventsMap, EventsMap} from "socket.io/dist/typed-events";
import type {z} from "zod";

function defaultClientError<T extends { error: { error: string } }>(
    error: Error,
    socket: Socket,
    io: Namespace
): void {
    socket.emit('error', {error: error.message});
}

function defaultServerError<T extends { error: { error: string } }>(
    error: Error,
    socket: Socket,
    io: Namespace
): void {
    socket.emit('error', {error: 'Server Error'});
    console.error(error);
}

type CheckedZHandler<T extends z.ZodRawShape> = {
    [key: string]: z.ZodObject<T>;
};

export default class CheckedNamespaceHandler<
    K extends z.ZodObject<Record<string, any>>,
    TSocketData = any,
    TListenEvents extends EventsMap = DefaultEventsMap,
    TEmitEvents extends EventsMap = DefaultEventsMap,
    TServerSideEvents extends EventsMap = DefaultEventsMap,
> extends NamespaceHandler<z.infer<K>, TSocketData, TListenEvents, TEmitEvents, TServerSideEvents> {
    constructor(
        namespace: string,
        io: Server<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>,
        private validator: K,
        handler: TypedNamespaceHandler<z.infer<typeof validator>, TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>,
        private options: CheckedNamespaceOption<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData> = {
            onClientError: defaultClientError,
            onServerError: defaultServerError,
            onConnection: () => true,
            onDisconnect: () => {
            }
        }
    ) {
        super(namespace, io, handler);
    }

    registerSocket(io: Namespace, socket: Socket): void {

        if (this.options.onConnection) {
            if (!this.options.onConnection(socket, io)) {
                return;
            }
        }

        socket.on('disconnecting', () => {
            if (this.options.onDisconnect) {
                this.options.onDisconnect(socket, io);
            }
        });

        for (const key in this.handler) {
            const handlerValidator = this.validator.shape[key];
            // .toString() is needed because when the key is disconnect,
            // disconnecting and error have different signatures
            socket.on(key.toString(), (...args: any[]) => {
                let parameter;
                if (args.length <= 1) {
                    parameter = handlerValidator.safeParse(args[0]);
                } else {
                    parameter = handlerValidator.safeParse(args);
                }

                if (!parameter.success) {
                    const error = parameter.error;
                    /* {
                      name: { _errors: [ 'Expected string, received number' ] }
                    } */
                    if (this.options.onClientError) {
                        this.options.onClientError(new ClientError(error), socket, io);
                    }
                    return;
                }
                try {
                    this.handler[key](parameter.data, socket, io);
                } catch (error) {
                    console.log("error")
                    if (error instanceof ClientError) {
                        if (this.options.onClientError) {
                            this.options.onClientError(error, socket, io);
                        }
                    } else if (error instanceof Error) {
                        console.error(error);
                        if (this.options.onServerError) {
                            this.options.onServerError(error, socket, io);
                        }
                    }
                }
            });
        }
    }
}
