import type {Socket} from "socket.io";

export type LobbySettings = {
    maxPlayers: number,
    chatRoomId?: string,
    isPrivate: boolean,
    password: string | null
};


export type Response<T> = {
    message: string,
    success: boolean,
    data: T | null
};

export type CreatedClientReturn = Response<{
    lobbyId: string,
    username: string,
    sessionKey: string
}>;

export type PlayerAuthenticationResponse = {
    username: string,
    sessionKey: string,
};

export type LobbyManagingEvents = {
    create: [{
        settings: LobbySettings
    }, (response: Response<string>) => void],
    join: [{
        lobbyId: string,
        username: string,
        password: string
    }, (response: Response<PlayerAuthenticationResponse>) => void],
    get: [{
        lobbyId: string,
    }, (response: Response<Partial<LobbySettings>>) => void],
};

export enum LobbyRole {
    PLAYER = "player",
    HOST = "host",
}

export type PlayerInfo = {
    username: string,
    role: LobbyRole,
    joinedTime: Date,
}

export type Player = PlayerInfo & {
    socket: Socket,
    sessionKey: string,
    reconnecting?: boolean,
}

export type LobbyInfo = {
    lobbyId: string,
    settings: LobbySettings
}

export type LobbyClientEvents = {
    joined: {
        lobbyInfo: LobbyInfo,
        role: LobbyRole,
        players: PlayerInfo[],
    },
    playerChanged: {
        players: PlayerInfo[],
    },
    error: {}
}

export type LobbyError = {
    code: number,
    message: string,
};

export type LobbyServerEvents = {
    lobbyNotFound: {
        code: 1,
        message: "Lobby not found",
    },
    lobbyFull: {
        code: 2,
        message: "Lobby is full",
    },
    wrongPassword: {
        code: 3,
        message: "Wrong password",
    },
    lobbyAlreadyExists: {
        code: 4,
        message: "Lobby already exists",
    },
}


export type LobbyLifeCycleEvents = {
    joined: {
        player: Player,
    },
    hostChanged: {
        player: Player,
    },
    playerChanged: {
        player: Player,
        joined: boolean,
        allPlayers: Player[],
    }
    playerRemoved: {
        player: Player
    },
    left: {
        player: Player,
    },
    disconnected: {
        socket: Socket,
    }
}
