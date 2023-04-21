export type LifeCycleEvents<T> = {
    [K in keyof T]?: ((data: T[K]) => void)[];
}

export class LifeCycle<T> {
    private events: LifeCycleEvents<T> = {};

    public when<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event]!.push(callback);
    }


    public emit<K extends keyof T>(event: K, data: T[K]): void {
        if (this.events[event]) {
            this.events[event]!.forEach(callback => callback(data));
        }
    }
}