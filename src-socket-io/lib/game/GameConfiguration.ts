import type {TypedNamespaceHandler} from "../socket/types";
import type {Namespace} from "socket.io";
import {RoomHandler} from "./RoomHandler";
import type {Player} from "../lobby/types";

export class GameConfiguration<GameConfigEvents, PlayerExtraInfo> extends RoomHandler<GameConfigEvents> {
    constructor(roomName: string, io: Namespace, handler: TypedNamespaceHandler<GameConfigEvents>) {
        super(roomName, io, handler);
    }

    start(players: Player<PlayerExtraInfo>[]) {
        this.join(players.map(player => player.socket));
    }
}