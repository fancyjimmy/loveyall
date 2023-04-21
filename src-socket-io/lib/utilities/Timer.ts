import {Listener} from './Listener';

export default class Timer {
    public readonly endListener = new Listener<() => void>();
    private isRunning: boolean = false;
    private timer: NodeJS.Timeout | undefined;

    constructor(private millis: number) {

    }

    get running() {
        return this.isRunning;
    }

    stop() {
        this.clear();
    }

    start(): boolean {
        if (this.timer) return false;
        this.timer = setTimeout(() => {
            this.end();
        }, this.millis);

        this.isRunning = true;
        return true;
    }

    reset() {
        this.clear();
        this.start();
    }

    private clear() {
        this.isRunning = false;
        if (this.timer) clearTimeout(this.timer);
    }

    private end() {
        this.endListener.call();
        this.isRunning = true;
    }
}
