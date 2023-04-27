import LobbyTimeoutPolicy from './LobbyTimeoutPolicy';
import type { LobbyTimeoutEvents } from './types';
import type { TimeOptions } from '../types';
import { getMillisFromTimeOptions } from '../index';
import Timer from '../../../../../utilities/Timer';

export default class TimeFromLastInteractionTimeoutPolicy extends LobbyTimeoutPolicy {
	private readonly millis: number;
	private timer: Timer;

	constructor(timeOptions: TimeOptions) {
		super();
		this.millis = getMillisFromTimeOptions(timeOptions);
		this.timer = new Timer(this.millis);
		this.timer.endListener.addListener(() => {
			this.timeout();
		});

		this.onTrigger('playerJoined', (count) => {
			this.timer.stop();
		});

		this.onTrigger('playerLeave', (count) => {
			if (count == 0) this.timer.start();
		});

		this.onTrigger('lobbyCreated', () => {
			this.timer.start();
		});
	}

	trigger<TKey extends keyof LobbyTimeoutEvents>(type: TKey, data: LobbyTimeoutEvents[TKey]): void {
		super.trigger(type, data);

		if (type === 'playerJoined') {
			this.timer.stop();
		} else if (type === 'playerLeave') {
			if (data == 0) this.timer.start();
		} else if (type === 'lobbyCreated') {
			this.timer.start();
		}
	}
}
