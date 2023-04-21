import NamespaceHandler from "../../socket/NamespaceHandler";
import type {Server} from "socket.io";
import type {TypedNamespaceHandler} from "../../socket/types";
import type {Player} from "../lobby/types";

export abstract class Game<Events, PlayerType> extends NamespaceHandler<Events> {
    protected constructor(namespace: string, io: Server, handler: TypedNamespaceHandler<Events>, public readonly condition: (players: Player<PlayerType>[]) => boolean) {
        super(namespace, io, handler);
    }

    abstract start(): void;

    canStart(players: Player<PlayerType>[]): boolean {
        return this.condition(players);
    }

    stop() {
        this.#stopCallbacks.forEach(callback => callback());
    };

    #stopCallbacks: (() => void)[] = [];

    whenStopped(callback: () => void): void {
        this.#stopCallbacks.push(callback);
    }
}