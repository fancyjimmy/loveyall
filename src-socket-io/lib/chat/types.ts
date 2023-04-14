export type ChatHandler = {
    join: {
        name: string;
    },
    leave: null,
    message: {
        message: string;
    },
    disconnect: null
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
