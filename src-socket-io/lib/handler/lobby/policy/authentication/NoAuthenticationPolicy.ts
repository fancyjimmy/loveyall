import AuthenticationPolicy from "./AuthenticationPolicy";
import type {LobbyJoinOption} from "../../manage/types";

export class NoAuthenticationPolicy extends AuthenticationPolicy {
    canJoin(lobbyJoinOption: LobbyJoinOption): boolean {
        return true;
    }

}