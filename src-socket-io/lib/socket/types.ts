import type {Namespace, Server, Socket} from "socket.io";

export type TypedServerHandler<Type> = {
    [Key in keyof Type]: (data: Type[Key], socket: Socket, io: Server) => void;
}


export type TypedNamespaceHandler<Type> = {
    [Key in keyof Type]: (data: Type[Key], socket: Socket, io: Namespace) => void;
}