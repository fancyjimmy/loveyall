import type {Card} from "./Card";
import type {PlayDirection, PlayerAction, PlayerActionInfo} from "./GameAction";
import type Player from "./Player";
import type GameAction from "./GameAction";
import Deck from "./Deck";


function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

export default class Game {
    cardHistory: Card[];
    currentPlayerIndex: number;
    currentPlayDirection: PlayDirection = "forward";

    deck: Deck = new Deck();

    #players: Player[];

    drawStack = 0;

    constructor(players: Player[]) {
        if (players.length < 2) throw new Error("Not enough players");
        this.cardHistory = [];
        this.currentPlayerIndex = 0;
        this.#players = players;

        this.cardHistory.push(this.deck.randomNormalCard());

        this.#players.forEach(player => {
            player.registerGame(this);
            this.dealCards(player);
        });
    }

    get tos(): Card {
        return this.cardHistory[this.cardHistory.length - 1];
    }

    dealCards(player: Player) {
        player.setHand(this.deck.draw(7));
    }

    get players() {
        return this.#players;
    }

    get currentPlayer() {
        return this.#players[this.currentPlayerIndex];
    }

    makeDraw(player: Player, count: number) {
        player.draw(this.deck.draw(count));
    }

    takeAction<T extends PlayerAction>(action: GameAction<T>) {
        if (action.player !== this.currentPlayer) {
            action.player.notifyError(new Error("Not your turn"));
            return;
        }
        switch (action.type) {
            case "play":
                this.play(action.player, action.data as PlayerActionInfo<"play">);
                break;
            case "draw":
                this.draw(action.player);
                break;
            case "quit":
                this.quit(action.player);
                break;
        }

    }


    private play(player: Player, data: PlayerActionInfo<"play">) {
        const card = data;
        // TODO check if card is in player's hand
        if (card.color === "black" && (card.type === "wild" || card.type === "draw4")) {
            player.notifyError(new Error("Can't play wild card or draw 4 card without color"));
            return;
        }

        if (this.isValidPlay(card)) {
            if (card.type === "skip") {
                this.nextPlayer();
            }
            if (card.type === "reverse") {
                this.currentPlayDirection = this.currentPlayDirection === "forward" ? "backward" : "forward";
            }

            if (this.drawStack > 0) {
                if (card.type === "draw4" && this.tos.type === "draw4") {
                    this.drawStack += 4;
                } else if (card.type === "draw2" && this.tos.type === "draw2") {
                    this.drawStack += 2;
                } else {
                    this.makeDraw(player, this.drawStack);
                    this.drawStack = 0;
                }
            }
            if (card.type === "draw4") {
                this.drawStack = 4;
            }

            if (card.type === "draw2") {
                this.drawStack = 2;
            }


            this.cardHistory.push(card);
            player.played(card);
            this.nextPlayer();
        } else {
            player.notifyError(new Error("Invalid play"));
        }

    }

    private isValidPlay(card: PlayerActionInfo<"play">) {
        const tos = this.tos;
        return card.color === tos.color || card.value === tos.value || card.type === "wild" || card.type === "draw4";
    }

    private nextPlayer() {

        if (this.currentPlayDirection === "forward") {
            this.currentPlayerIndex = mod(this.currentPlayerIndex + 1, this.players.length);
        } else {
            this.currentPlayerIndex = mod(this.currentPlayerIndex - 1, this.players.length);
        }
    }

    private draw(player: Player) {
        if (this.drawStack > 0) {
            player.draw(this.deck.draw(this.drawStack));
        }
        player.draw(this.deck.draw(1));
        this.nextPlayer();
    }

    private quit(player: Player) {
        this.players.splice(this.players.indexOf(player), 1);
        if (this.players.length === 1) {
            this.win(this.players[0]);
        }
    }

    private win(player: Player) {
        console.log(`${player.name} won!`);
    }
}
