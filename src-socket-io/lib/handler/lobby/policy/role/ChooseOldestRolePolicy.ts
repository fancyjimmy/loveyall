import type RolePolicy from './RolePolicy';
import { LobbyRole, type PlayerInfo } from '../../types';
import type Player from '../../playerManager/Player';

export default class ChooseOldestRolePolicy implements RolePolicy {
	setNextHost(players: Player[], leavingPlayer: PlayerInfo): Player | null {
		if (leavingPlayer.role !== LobbyRole.HOST) return null;
		if (players.length === 0) return null;

		let nextHost = players[0];
		for (let i = 1; i < players.length; i++) {
			const player = players[i];
			if (player.playerInfo.joinedTime < nextHost.playerInfo.joinedTime) {
				nextHost = player;
			}
		}

		nextHost.playerInfo.role = LobbyRole.HOST;
		return nextHost;
	}
}
