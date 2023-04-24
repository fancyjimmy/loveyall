import type AuthenticationPolicy from './AuthenticationPolicy';
import {AuthenticationPolicyType, type LobbyCreationSettings} from "../../manage/types";
import PasswordAuthenticationPolicy from './PasswordAuthenticationPolicy';
import {NoAuthenticationPolicy} from "./NoAuthenticationPolicy";

export {AuthenticationPolicy};
export {default as PasswordAuthenticationPolicy} from './PasswordAuthenticationPolicy';

export namespace AuthenticationPolicyFactory {
    export function getAuthenticationPolicy(lobbyCreationSettings: LobbyCreationSettings): AuthenticationPolicy {
        switch (lobbyCreationSettings.authenticationPolicy.name) {
            case AuthenticationPolicyType.PASSWORD:
                return new PasswordAuthenticationPolicy(lobbyCreationSettings, lobbyCreationSettings.authenticationPolicy.password);
            default:
                return new NoAuthenticationPolicy(lobbyCreationSettings);
        }
    }
}