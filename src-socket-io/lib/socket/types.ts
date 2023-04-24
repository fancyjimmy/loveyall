import type {Namespace, Server, Socket} from 'socket.io';
import type {DefaultEventsMap, EventsMap} from 'socket.io/dist/typed-events';
import type ClientError from "../ClientError";

export type TypedServerHandler<Type> = {
    [Key in keyof Type]: (data: Type[Key], socket: Socket, io: Server) => void;
};

export type TypedNamespaceHandler<
    Type,
    TListenEvents extends EventsMap = EventsMap,
    TEmitEvents extends EventsMap = EventsMap,
    TServerSideEvents extends EventsMap = EventsMap,
    TSocketData = any
> = {
    [Key in keyof Type]: (
        data: Type[Key],
        socket: Socket<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>,
        io: Namespace<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>
    ) => void;
};

export type CheckedNamespaceOption<TListenEvents extends EventsMap = DefaultEventsMap,
    TEmitEvents extends EventsMap = DefaultEventsMap,
    TServerSideEvents extends EventsMap = DefaultEventsMap,
    TSocketData = any> = {
    onClientError?: (error: ClientError, socket: Socket<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>, io: Namespace<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>) => void;
    onServerError?: (error: Error, socket: Socket<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>, io: Namespace<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>) => void;
    onConnection?: (socket: Socket<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>, io: Namespace<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>) => boolean; // return false to block the connection
    onDisconnect?: (socket: Socket<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>, io: Namespace<TListenEvents, TEmitEvents, TServerSideEvents, TSocketData>) => void; // Not called, when the connection is blocked
};

export type SocketError = {
    error: string;
};
