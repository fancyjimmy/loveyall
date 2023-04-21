import TimeoutPolicy from "./TimeoutPolicy";
import {Listener} from "../../../../utilities/Listener";

export default abstract class ResetAbleTimeoutPolicy<TEvent extends Record<string, any>> extends TimeoutPolicy<TEvent> {
    private resetListener: Listener<() => void> = new Listener<() => void>();

    onReset(callback: () => void): number {
        return this.resetListener.addListener(callback);
    };

    clearOnReset(): void {
        this.resetListener.clear();
    }

    removeOnReset(key: number): void {
        this.resetListener.removeListener(key);
    }

    protected abstract reset(): void;
}