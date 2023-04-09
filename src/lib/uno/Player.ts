import type {Card} from "./Card";
import type Game from "./Game";
import GameAction from "./GameAction";

export default class Player {
    get game(): Game {
        return this.#game!;
    }

    hand: Card[];
    name: string;
    #game: Game | null = null;

    constructor(name: string) {
        this.hand = [];
        this.name = name;
    }

    registerGame(game: Game) {
        this.#game = game;
    }

    setHand(cards: Card[]) {
        this.hand = cards;
    }

    playCard(card: Card) {
        this.game.takeAction(new GameAction(this, "play", card));
    }

    drawCard() {
        this.game.takeAction(new GameAction(this, "draw", null));
    }

    notifyError(error: Error) {
        console.error(this);
        console.error(error);
    }

    draw(cards: Card[]) {
        this.hand = [...this.hand, ...cards];
    }


    /**
     * Removes a card from the player's hand, should only be called by the Game class
     * @param card
     */
    played(card: Card) {
        this.hand.splice(this.hand.indexOf(card), 1);
    }
}

