import type {Player} from "../lobby/types";

export type GameCondition = (players: Player[]) => boolean;

