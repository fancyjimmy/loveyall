export type LobbyTimeoutEvents = {
    lobbyCreated: void;
    playerJoined: number; // amount of player joined
    playerLeave: number; // amount of player left
    playerRejoin: void; // amount of player rejoined
    playerTyped: void;
    playerInteraction: void; // things like changing settings, kicking People
}