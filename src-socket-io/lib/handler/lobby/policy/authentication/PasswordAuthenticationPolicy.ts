import AuthenticationPolicy from "./AuthenticationPolicy";
import type {LobbyCreationSettings, LobbyJoinOption} from "../../manage/types";

export default class PasswordAuthenticationPolicy extends AuthenticationPolicy {
    constructor(lobbyCreationSettings: LobbyCreationSettings, public password: string) {
        super(lobbyCreationSettings);
    }

    canJoin(lobbyJoinOption: LobbyJoinOption): boolean {
        return lobbyJoinOption.password === this.password;
    }

}