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


export enum Colors {
    Yellow = "yellow",
    Green = "green",
    Red = "red",
    Blue = "blue",
    Black = "black"
};

export enum CardTypes {
    Number = "number",
    Skip = "skip",
    Reverse = "reverse",
    Draw2 = "draw2",
    Wild = "wild",
    Draw4 = "draw4"
};
