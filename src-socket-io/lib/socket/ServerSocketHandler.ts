import type {Server, Socket} from "socket.io";

export default interface ServerSocketHandler {
    registerSocket(io: Server, socket: Socket): void;
}