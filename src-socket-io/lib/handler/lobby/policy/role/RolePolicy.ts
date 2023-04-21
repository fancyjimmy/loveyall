import type {Player, PlayerInfo} from "../../types";

export default interface RolePolicy {
    nextHost: (players: Player[], leavingPlayer: PlayerInfo) => Player | null;
}

