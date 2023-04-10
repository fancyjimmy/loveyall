import type ServerSocketHandler from "./ServerSocketHandler";
import type {Server, Socket} from "socket.io";
import type {TypedServerHandler} from "./types";

export class ServerHandler<T> implements ServerSocketHandler {

    private listeners = {};

    registerSocket(io: Server, socket: Socket) {
        const specificEvents = ["disconnect", "disconnecting"];
        for (let key in this.handler) {
            let realKey = `${this.nameSpace}:${key}`;
            if (specificEvents.includes(key)) {
                realKey = `${key}`;
            }
            // Doesn't work with Acknowledgements or multiple params.
            // to do that data needs to be replaced with ...args, but then it's not type safe anymore
            const listener = (data) => {
                return this.handler[key](data, socket, io);
            }

            socket.on(realKey, listener);

            this.listeners[realKey] = listener;
        }
    }

    unregister(socket: Socket) {
        for (let key in this.listeners) {
            socket.off(key, this.listeners[key]);
        }
    }


    protected handler: TypedServerHandler<T>;
    protected nameSpace: string;

    constructor(nameSpace: string, handler: TypedServerHandler<T>) {
        this.handler = handler;
        this.nameSpace = nameSpace;
    }
}