import type {Socket} from "socket.io";

export type ChatHandler = {
    join: {
        name: string;
    },
    leave: null,
    message: {
        message: string;
    },
    disconnect: null,
    connect: null
}

export type ChatRoomHandler = {
    create: {
        name: string;
    },
    get: null,
    leave: null,
}

export type ChatUserInfo = {
    id: string
    name: string,
}

export type MessageCallback<T> = (message: string, user: Socket, info: ChatUserInfo) => T;
