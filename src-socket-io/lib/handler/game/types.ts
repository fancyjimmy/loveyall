import type {Player} from "../lobby/manage/types";

export type GameCondition = (players: Player[]) => boolean;

