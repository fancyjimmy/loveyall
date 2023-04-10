import type {Server, Socket} from "socket.io";

export type TypedServerHandler<Type> = {
    [Key in keyof Type]: (data: Type[Key], socket: Socket, io: Server) => void;
}