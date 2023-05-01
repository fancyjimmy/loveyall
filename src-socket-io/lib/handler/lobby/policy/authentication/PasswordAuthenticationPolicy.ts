import type AuthenticationPolicy from './AuthenticationPolicy';
import type { LobbyJoinOption } from '../../manage/types';

export default class PasswordAuthenticationPolicy implements AuthenticationPolicy {
	constructor(public password: string) {}

	canJoin(lobbyJoinOption: LobbyJoinOption): boolean {
		return lobbyJoinOption.password === this.password;
	}
}
