import type {Namespace, Server, Socket} from 'socket.io';

import zod, {ZodObject, type ZodRawShape} from 'zod';
import type {CheckedNamespaceOptions, TypedNamespaceHandler} from './types';
import NamespaceHandler from './NamespaceHandler';

const Test = zod.object({name: zod.string(), other: zod.number()});

function defaultParseError<T extends { error: { error: string } }>(
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

type CheckedZHandler<T extends ZodRawShape> = {
    [key: string]: ZodObject<T>;
};

export default class CheckedNamespaceHandler<K extends ZodObject<any>> extends NamespaceHandler<
    zod.infer<K>
> {
    constructor(
        namespace: string,
        io: Server,
        private validator: K,
        handler: TypedNamespaceHandler<zod.infer<typeof validator>>,
        private options: CheckedNamespaceOptions = {
            onParseError: defaultParseError,
            onServerError: defaultServerError,
            onConnection: () => true,
            onDisconnect: () => {
            }
        }
    ) {
        super(namespace, io, handler);
    }

    registerSocket(io: Namespace, socket: Socket): void {
        socket.on('disconnecting', () => {
            if (this.options.onDisconnect) {
                this.options.onDisconnect(socket, io);
            }
        });

        if (this.options.onConnection) {
            if (!this.options.onConnection(socket, io)) {
                return;
            }
        }
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
                    if (this.options.onParseError) {
                        this.options.onParseError(new Error(error), socket, io);
                    }
                    return
                }
                try {
                    this.handler[key](parameter.data, socket, io);
                } catch (error) {
                    if (error instanceof Error) {
                        if (this.options.onServerError) {
                            this.options.onServerError(error, socket, io);
                        }
                    }
                }
            });
        }


    }
}
