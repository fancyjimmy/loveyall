import type {ChatGame} from "./ChatGame";
import type {ServerChatHandler} from "../../chat";
import type {MessageCallback} from "../../chat/types";

export class ChatGameManager {
    private readonly chatHandler: ServerChatHandler;
    private chatGames: ChatGame[] = [];

    constructor(chatHandler: ServerChatHandler) {
        this.chatHandler = chatHandler;
    }

    addChatGame(condition: MessageCallback<boolean>, chatGame: ChatGame, repeatable: boolean = false) {
        let id = chatGame.startIf(condition);
        if (repeatable) {
          chatGame.whenStopps(() => {
            chatGame.reset();
          });
        } else {
          chatGame.whenStopps(() => {
            this.chatHandler.removeMessageCallback(id);
          });
        }
    }

    stopAllChatGames() {
        this.chatGames.forEach((chatGame) => chatGame.stop());
    }
}