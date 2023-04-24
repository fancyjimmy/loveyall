import type NamespaceHandler from "./lib/socket/NamespaceHandler";
import type {ServerHandler} from "./lib/socket/ServerHandler";

export default class HandlerManager {
    private readonly severHandler: ServerHandler<unknown>[] = [];
    private readonly namespaceHandler: NamespaceHandler<unknown, unknown>[] = [];

    constructor(severHandler: ServerHandler<unknown>[] = []) {
        this.severHandler.push(...severHandler);
    }


    register() {
        for (const handler of this.severHandler) {
            handler.register();
        }
        for (const handler of this.namespaceHandler) {
            handler.register();
        }
    }


}