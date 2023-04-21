export class Listener<TFunction extends (...args: any[]) => unknown> {
    public listeners = new Map<number, TFunction>();
    private counter = 0;

    removeListener(key: number) {
        this.listeners.delete(key);
    }

    removeListenerByFunction(value: TFunction) {
        this.listeners.forEach((listener, key) => {
            if (listener === value) {
                this.listeners.delete(key);
            }
        });
    }

    addListener(listener: TFunction) {
        this.counter++;
        this.listeners.set(this.counter, listener);
        return this.counter;
    }

    clear() {
        this.listeners.clear();
    }

    call(...args: Parameters<TFunction>) {
        this.listeners.forEach(listener => listener(...args));
    }
}
