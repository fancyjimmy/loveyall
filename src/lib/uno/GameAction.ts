import type {Card} from "./Card";
import type Player from "./Player";

export type PlayDirection = "forward" | "backward";
export type PlayerAction = "play" | "draw" | "quit";
export type PlayerActionInfos = {
    play: Card;
    draw: null;
    quit: null;
};

export type PlayerActionInfo<T extends PlayerAction> = PlayerActionInfos[T];



export default class GameAction<T extends PlayerAction> {
    player: Player;
    type: T;
    data: PlayerActionInfo<T>;

    constructor(player: Player, type: T, data: PlayerActionInfo<T>) {
        this.player = player;
        this.type = type;
        this.data = data;
    }
}
