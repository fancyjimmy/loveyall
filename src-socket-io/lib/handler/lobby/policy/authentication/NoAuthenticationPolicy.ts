import type AuthenticationPolicy from './AuthenticationPolicy';
import type { LobbyJoinOption } from '../../manage/types';

export class NoAuthenticationPolicy implements AuthenticationPolicy {
	canJoin(lobbyJoinOption: LobbyJoinOption): boolean {
		return true;
	}
}
