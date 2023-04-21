import type {Player, PlayerInfo} from '../../types';
import {LobbyRole} from '../../types';
import type RolePolicy from './RolePolicy';

export default class ChooseOldestRolePolicy implements RolePolicy {
    nextHost(players: Player[], leavingPlayer: PlayerInfo): Player | null {
        if (leavingPlayer.role !== LobbyRole.HOST) return null;
        if (players.length === 0) return null;

        let nextHost = players[0];
        for (let i = 1; i < players.length; i++) {
            const player = players[i];
            if (player.joinedTime < nextHost.joinedTime) {
                nextHost = player;
            }
        }
        return nextHost;
    }
}
