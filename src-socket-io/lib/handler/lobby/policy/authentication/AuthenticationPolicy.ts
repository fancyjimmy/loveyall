import type {LobbyCreationSettings, LobbyJoinOption} from "../../manage/types";
import PlayerManager from "../../playerManager/PlayerManager";

export default abstract class AuthenticationPolicy {
    public readonly playerManager: PlayerManager;

    constructor(lobbyCreationSettings: LobbyCreationSettings) {
        this.playerManager = new PlayerManager(lobbyCreationSettings.maxPlayers);
    }

    abstract canJoin(lobbyJoinOption: LobbyJoinOption): boolean;

    setUpPlayer(lobbyJoinOption: LobbyJoinOption) {
        return this.playerManager.addPlayer(lobbyJoinOption);
    };

}