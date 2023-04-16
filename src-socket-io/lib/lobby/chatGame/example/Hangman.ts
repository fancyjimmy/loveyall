import {ChatGame} from "../ChatGame";
import type {ServerChatHandler} from "../../../chat";


const hangmanWords: string[] = [
    "hangman",
    "word",
    "apple",
    "banana",
    "orange",
    "strawberry",
    "pineapple",
    "watermelon",
    "grape",
    "grapefruit",
    "water",
    "fire",
    "earth",
    "air",
    "wind",
    "spiral"
]

class HangmanWord {
    public readonly guesses: string[] = [];

    constructor(public readonly word: string) {
        this.word = word.toLowerCase();
    }

    contains(character: string): boolean {
        return this.guesses.includes(character.toLowerCase());
    }

    guess(character: string): boolean {
        this.guesses.push(character.toLowerCase());

        if (this.word.includes(character.toLowerCase())) {
            return true;
        }
        return false;
    }

    guessWord(word: string): boolean {
        let guessed = this.word === word.toLowerCase();
        if (guessed) {
            this.guessedAsWord = true;
        } else {
            this.guesses.push(word.toLowerCase());
        }
        return guessed;
    }

    private guessedAsWord: boolean = false;

    isGuessed(): boolean {
        return this.guessedAsWord || this.word.split("").every((char) => this.guesses.includes(char));
    }

    getRepresentation(): string {
        return this.word.split("").map((char) => {
            if (this.guesses.includes(char)) {
                return char;
            } else {
                return "_";
            }
        }).join(" ");
    }
}

export class Hangman extends ChatGame {
    constructor(chatHandler: ServerChatHandler, private maxTurns: number = 5) {
        super(chatHandler);
    }

    private users: { [username: string]: number } = {};

    private word: HangmanWord = new HangmanWord("");
    private guesses: number = 0;

    start(): void {
        this.guesses = 0;
        this.word = new HangmanWord(hangmanWords[Math.floor(Math.random() * hangmanWords.length)]);
        this.broadcastMessage("Game started", "Hangman", {server: true});
        this.broadcastMessage(this.word.getRepresentation(), "Hangman", {server: true});

        this.whenMessage((message, user, extra) => {

            //regex to check if message follows pattern "/guess <char>" with the "/" being optional
            if (/^\/?guess\s[a-zA-Z]$/.test(message)) {
                const guess = message.split(" ")[1];
                if (this.word.contains(guess)) {
                    this.broadcastMessage("Already Guessed", "Hangman", {server: true});
                    this.broadcastMessage(this.word.guesses.join(", "), "Hangman", {server: true});
                    return;
                }
                if (this.word.guess(guess)) {
                    this.broadcastMessage(`Correct! ${this.maxTurns - this.guesses} guesses left`, "Hangman", {server: true});
                    if (this.word.isGuessed()) {
                        this.stop();
                        return;
                    }
                } else {
                    this.guesses++;
                    if (this.guesses >= this.maxTurns) {
                        this.stop();
                        return;
                    } else {
                        this.broadcastMessage(`Wrong! ${this.maxTurns - this.guesses} guesses left`, "Hangman", {server: true});
                    }
                }
                this.broadcastMessage(this.word.getRepresentation(), "Hangman", {server: true});
            } else if (/^\/?guess\s[a-zA-Z]+$/.test(message)) {
                const guess = message.split(" ")[1];
                /*
                if (guess.length !== this.word.word.length){
                    this.broadcastMessage("Wrong length", "Hangman", {server: true});
                    return;
                }
                 */
                if (this.word.contains(guess)) {
                    this.broadcastMessage("Already Guessed", "Hangman", {server: true});
                    this.broadcastMessage(this.word.guesses.join(", "), "Hangman", {server: true});
                    return;
                }
                if (this.word.guessWord(guess)) {
                    this.stop();
                } else {
                    this.guesses++;
                    if (this.guesses >= this.maxTurns) {
                        this.stop();
                        return;
                    } else {
                        this.broadcastMessage(`Wrong! ${this.maxTurns - this.guesses} guesses left`, "Hangman", {server: true});

                    }
                }
            }

        });
    }

    stop() {
        super.stop();

        if (this.word.isGuessed()) {
            this.broadcastMessage(`You won!!! The word was ${this.word.word}`, "Hangman", {server: true});
        } else {
            this.broadcastMessage(`You lost!!! The word was ${this.word.word}`, "Hangman", {server: true});
        }
    }


}