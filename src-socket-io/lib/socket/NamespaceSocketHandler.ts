import type {Namespace, Socket} from "socket.io";

export default interface NamespaceSocketHandler {
    registerSocket(io: Namespace, socket: Socket): void;
}