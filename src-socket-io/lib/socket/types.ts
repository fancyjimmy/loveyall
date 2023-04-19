import type {Namespace, Server, Socket} from "socket.io";

export type TypedServerHandler<Type> = {
    [Key in keyof Type]: (data: Type[Key], socket: Socket, io: Server) => void;
}

export type TypedNamespaceHandler<Type> = {
    [Key in keyof Type]: (data: Type[Key], socket: Socket, io: Namespace) => void;
}

export type CheckedNamespaceOptions = {
    onParseError?: (error: Error, socket: Socket, io: Namespace) => void,
    onServerError?: (error: Error, socket: Socket, io: Namespace) => void,
    onConnection?: (socket: Socket, io: Namespace) => boolean, // return false to block the connection
    onDisconnect?: (socket: Socket, io: Namespace) => void, // Not called, when the connection is blocked
}


export type SocketError = {
    error: string;
}