export type LobbySettings = {
    maxPlayers: number,
    withScore: string,
};

export type LobbyManagingEvents = {
    create: {
        password: string,
        settings: LobbySettings
        username: string
    },
    join: {
        lobbyId: string,
        username: string,
        password: string
    },
    leave: null,
    disconnect: null,
};
export type LobbyRole = "admin" | "player";

export type Player = {
    id: string,
    username: string,
    role: LobbyRole,
    joinedTime: Date,
}

export type LobbyInfo = {
    lobbyId: string,
    chatRoomId?: string,
    settings: LobbySettings
}

export type LobbyClientEvents = {
    created: {
        lobbyId: string,
    },
    joined: {
        lobbyInfo: LobbyInfo,
        role: LobbyRole,
        username: string,
        sessionKey: string, // used to identify the user in the lobby and if you have it you can reconnect to the lobby
        players: Player[],
    },
    userChanged: {
        players: Player[],
    }
}