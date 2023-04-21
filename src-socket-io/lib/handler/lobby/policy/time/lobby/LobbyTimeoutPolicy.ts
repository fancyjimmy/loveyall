import TimeoutPolicy from "../TimeoutPolicy";
import type {LobbyTimeoutEvents} from "./types";


export default abstract class LobbyTimeoutPolicy extends TimeoutPolicy<LobbyTimeoutEvents> {
}

