import {ChatGame} from "../ChatGame";
import type {ServerChatHandler} from "../../../chat";

export class TestChatGame extends ChatGame {
    constructor(chatHandler: ServerChatHandler) {
        super(chatHandler);
    }

    private counts: number = 0;

    start(): void {
        this.broadcastMessage("started", "TestChatGame", {server: true});
        this.whenMessage((message, user, info) => {
            if (message.startsWith("p")) {
                this.broadcastMessage(`pong ${this.counts++}`, "TestChatGame", {
                    server: true
                });

                if (this.counts > 3) {
                    this.stop();
                    this.reset();
                }
            }
        })
    }

    reset(): void {
        super.reset();
        this.counts = 0;
    }

    stop(): void {
        super.stop();
        this.broadcastMessage("I am finished", "TestChatGame", {
            server: true
        });
    }

}