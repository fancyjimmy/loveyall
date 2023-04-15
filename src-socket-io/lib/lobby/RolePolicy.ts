import type {Player, PlayerInfo} from "./types";

export interface RolePolicy {
    nextHost: (players: Player[], leavingPlayer: PlayerInfo) => Player;
}

export class DefaultRolePolicy implements RolePolicy {
    nextHost(players: Player[], leavingPlayer: PlayerInfo): Player {
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