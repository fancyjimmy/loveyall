import TimeoutPolicy from "../TimeoutPolicy";
import Timer from "../../../../../utilities/Timer";


export type PlayerTimeoutEvents = {
    disconnect: null,
    bind: null,
};

export default class PlayerTimeoutPolicy extends TimeoutPolicy<PlayerTimeoutEvents> {

    private timer: Timer;

    constructor(millis: number) {
        super();
        this.timer = new Timer(millis);
        this.timer.start();
        this.timer.endListener.addListener(() => {
            this.timeout();
        });
    }

    trigger<TKey extends keyof PlayerTimeoutEvents>(type: TKey, data: PlayerTimeoutEvents[TKey]): void {
        if (type === 'disconnect') {
            console.log("Start timer");
            this.timer.start()
        } else if (type === 'bind') {
            console.log("Stop timer");
            this.timer.stop();
        }
    }

    protected onTrigger<TKey extends keyof PlayerTimeoutEvents>(type: TKey, callback: (data: PlayerTimeoutEvents[TKey]) => void): void {
    }
}