import TimeoutPolicy from '../TimeoutPolicy';
import Timer from '../../../../../utilities/Timer';

export type PlayerTimeoutEvents = {
	disconnect: null;
	bind: null;
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

		this.onTrigger('disconnect', () => {
			this.timer.start();
		});

		this.onTrigger('bind', () => {
			this.timer.stop();
		});
	}
}
