export type Color = "yellow" | "green" | "red" | "blue" | "black";
export type CardType = "number" | "skip" | "reverse" | "draw2" | "wild" | "draw4";
export type CardValue =
    "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "10"
    | "skip"
    | "reverse"
    | "draw2"
    | "wild"
    | "draw4";

export type Card = {
    color: Color;
    type: CardType;
    value: CardValue;
};

class Player {
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
        this.game.takeAction(new Action(this, "play", card));
    }

    drawCard() {
        this.game.takeAction(new Action(this, "draw", null));
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


enum Colors {
    Yellow = "yellow",
    Green = "green",
    Red = "red",
    Blue = "blue",
    Black = "black"
};

enum CardTypes {
    Number = "number",
    Skip = "skip",
    Reverse = "reverse",
    Draw2 = "draw2",
    Wild = "wild",
    Draw4 = "draw4"
};

type PlayDirection = "forward" | "backward";

class Deck {
    // TODO clean up this code and make it more standartised

    randomNormalCard(): Card {
        const color = this.randomNormalColor();
        const value = Math.floor(Math.random() * 10).toString() as CardValue;
        return {color, type: "number", value};
    }

    randomNormalColor(): Color {
        const colors = Object.values(Colors).filter(color => color !== "black");
        return colors[Math.floor(Math.random() * (colors.length))];
    }

    randomColor(): Color {
        const colors = Object.values(Colors);
        return colors[Math.floor(Math.random() * colors.length)];
    }

    randomCardType(): CardType {
        const cardTypes = Object.values(CardTypes);
        return cardTypes[Math.floor(Math.random() * cardTypes.length)];
    }

    generateCard(): Card {
        const cardType = this.randomCardType();
        const color = cardType === "wild" || cardType === "draw4" ? "black" : this.randomNormalColor();
        const value = cardType === "number" ? Math.floor(Math.random() * 10).toString() as CardValue : cardType;
        return {color, type: cardType, value};
    }

    draw(count: number): Card[] {
        return Array.from({length: count}, () => this.generateCard());
    }
}

type PlayerAction = "play" | "draw" | "quit";
type PlayerActionInfos = {
    play: Card;
    draw: null;
    quit: null;
}

type PlayerActionInfo<T extends PlayerAction> = PlayerActionInfos[T];

class Action<T extends PlayerAction> {
    player: Player;
    type: T;
    data: PlayerActionInfo<T>;

    constructor(player: Player, type: T, data: PlayerActionInfo<T>) {
        this.player = player;
        this.type = type;
        this.data = data;
    }
}

function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

class Game {
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

    takeAction<T extends PlayerAction>(action: Action<T>) {
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

export const game = new Game([
    new Player("Seb"),
    new Player("Jim")]
);


