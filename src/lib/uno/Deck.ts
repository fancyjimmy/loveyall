import {type Card, type CardType, CardTypes, type CardValue, type Color, Colors} from "./Card";

export default class Deck {
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