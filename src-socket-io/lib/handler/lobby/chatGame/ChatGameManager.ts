import type {ChatGame} from "./ChatGame";
import type {ServerChatHandler} from "../../chat";
import type {MessageCallback} from "../../chat/types";

export class ChatGameManager {
    private readonly chatHandler: ServerChatHandler;
    private chatGames: ChatGame[] = [];

    constructor(chatHandler: ServerChatHandler) {
        this.chatHandler = chatHandler;
    }

    addChatGame(condition: MessageCallback<boolean>, chatGame: ChatGame, remove: boolean = true) {
        let id = chatGame.startIf(condition);
        if (remove) {
            chatGame.whenStopps(() => {
                this.chatHandler.removeMessageCallback(id);
            });
        } else {
            chatGame.whenStopps(() => {
                chatGame.reset();
            })
        }

    }

    stopAllChatGames() {
        this.chatGames.forEach((chatGame) => chatGame.stop());
    }
}