import type {ChatUserInfo, MessageCallback} from "../../chat/types";
import type {ServerChatHandler} from "../../chat";

export abstract class ChatGame {
    private readonly chatHandler: ServerChatHandler;
    private started = false;

    protected constructor(chatHandler: ServerChatHandler) {
        this.chatHandler = chatHandler;
    }

    abstract start(): void;

    whenStopps(callback: () => void) {
        this.#onStop = callback;
    };

    #onStop: () => void = () => {
    };

    stop(): void {
        this.callbackIds.forEach((callbackId) => this.chatHandler.removeMessageCallback(callbackId));
        this.callbackIds = [];
        this.#onStop();
    };

    reset(): void {
        this.started = false;
    }

    private callbackIds: number[] = [];

    whenMessage(messageCallback: MessageCallback<any>): number {
        let callbackId = this.chatHandler.whenMessage(messageCallback);
        this.callbackIds.push(callbackId);
        return callbackId;
    }

    removeMessageCallback(id: number) {
        if (this.callbackIds.includes(id)) {
            this.callbackIds = this.callbackIds.filter((callbackId) => callbackId !== id);
            this.chatHandler.removeMessageCallback(id);
        }
    }


    broadcastMessage(message: string, user: string, extra: any) {
        this.chatHandler.broadcastMessage(message, user, extra);
    }


    startIf(condition: MessageCallback<boolean>): number {
        return this.chatHandler.whenMessage((...args) => {
            if (condition(...args) && !this.started) {
                this.started = true;
                this.start();
            }
        })
    }

    getClientUsers(): ChatUserInfo[] {
        return this.chatHandler.getClientUsers();
    }
}

