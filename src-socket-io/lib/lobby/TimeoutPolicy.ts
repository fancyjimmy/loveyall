export interface Timer {
    startTimer(): void;

    resetTimer(): void;

    onTimeout(callback: () => void): void;

    onReset(callback: () => void): void;

    stop(): void;

    running: boolean;
}

export type TimerOptions = {
    milliseconds?: number,
    seconds?: number,
    minutes?: number,
    hours?: number,
    days?: number
};

export function getMillisFromTimerOptions(options: TimerOptions): number {
    let millis = 0;
    if (options.milliseconds) {
        millis += (options.milliseconds ?? 0);
    }
    if (options.seconds) {
        millis += (options.seconds ?? 0) * 1000;
    }
    if (options.minutes) {
        millis += (options.minutes ?? 0) * 1000 * 60;
    }
    if (options.hours) {
        millis += (options.hours ?? 0) * 1000 * 60 * 60;
    }
    if (options.days) {
        millis += (options.days ?? 0) * 1000 * 60 * 60 * 24;
    }
    return millis;
}


export class DefaultTimer implements Timer {
    private timeoutCallbacks: (() => void)[] = [];
    private resetCallbacks: (() => void)[] = [];

    private timer: NodeJS.Timeout | null = null;
    public readonly fullTime: number;


    constructor(time: TimerOptions) {
        this.fullTime = getMillisFromTimerOptions(time);
    }

    onReset(callback: () => void): void {
        this.resetCallbacks.push(callback);
    }

    onTimeout(callback: () => void): void {
        this.timeoutCallbacks.push(callback);
    }

    resetTimer(): void {
        this.clear();
        this.setTimeout();
        this.resetCallbacks.forEach(cb => cb());
    }

    private setTimeout() {
        const timer = setTimeout(() => {
            this.timeoutCallbacks.forEach(callback => callback());
        }, this.fullTime);

        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.timer = timer;
    }

    startTimer(): void {
        this.setTimeout();
        this.#running = true;
    }

    private clear() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    stop(): void {
        this.clear();
        this.#running = false;
    }

    #running: boolean = false;

    get running(): boolean {
        return this.#running;
    };

}

/*
Example use case

const lobby = new Lobby();
lobby.inactivityTimer = new Timer(minutes = 5);
lobby.inactivityTimer.startTimer();
lobby.inactivityTimer.onTimeout(() => {
    lobby.close();
});

lobby.onJoin(() => {
    lobby.inactivityTimer.resetTimer();
});

const socketTimer = new Timer(minutes = 5);
socketTimer.startTimer();
socketTimer.onTimeout(() => {
    socket.disconnect();
});

socketTimer.stop();

lobby.closeTimer = new Timer(days = 12); // MaxTime
lobby.closeTimer.startTimer();
lobby.closeTimer.onTimeout(() => {
    lobby.close();
});


lobby
 */