import type { LobbyJoinOption } from '../../manage/types';

export default interface AuthenticationPolicy {
	canJoin(lobbyJoinOption: LobbyJoinOption): boolean;
}
