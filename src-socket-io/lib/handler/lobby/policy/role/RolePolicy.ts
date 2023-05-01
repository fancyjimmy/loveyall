import type { PlayerInfo } from '../../types';
import type Player from '../../playerManager/Player';

export default interface RolePolicy {
	setNextHost: (players: Player[], leavingPlayer: PlayerInfo) => Player | null;
}
