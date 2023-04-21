import {Listener} from "../../../../utilities/Listener";

export default abstract class TimeoutPolicy<TEvent extends Record<string, any>> {
    private timeoutListener: Listener<() => void> = new Listener<() => void>();

    abstract trigger<TKey extends keyof TEvent>(type: TKey, data: TEvent[TKey]): void;

    onTimeout(callback: () => void): number {
        return this.timeoutListener.addListener(callback);
    }

    clearOnTimeout(): void {
        this.timeoutListener.clear();
    }

    removeOnTimeout(key: number): void {
        this.timeoutListener.removeListener(key);
    }

    protected abstract onTrigger<TKey extends keyof TEvent>(type: TKey, callback: (data: TEvent[TKey]) => void): void;

    protected timeout() {
        this.timeoutListener.call();
    };
}
