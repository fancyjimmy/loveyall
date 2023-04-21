import type {PlayerInfo} from "../../types";

export default abstract class AuthenticationPolicy {
    abstract getPlayer(session: string): PlayerInfo | null;

    abstract removePlayer(session: string): void;

    abstract createPlayer(playerInfo: PlayerInfo): string;

}