import type {PlayerInfo} from "../../types";

export default interface RolePolicy {
    setNextHost: (players: PlayerInfo[], leavingPlayer: PlayerInfo) => PlayerInfo | null;
}

