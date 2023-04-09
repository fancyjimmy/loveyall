import type {Card, CardType, CardValue, Color} from "./uno/Card";
import {CardTypes, Colors} from "./uno/Card";
import Game from "./uno/Game";
import Player from "./uno/Player";


export const game = new Game([
    new Player("Seb"),
    new Player("Jim")]
);


