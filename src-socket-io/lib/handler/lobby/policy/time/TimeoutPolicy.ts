import { Listener } from '../../../../utilities/Listener';

export default abstract class TimeoutPolicy<TEvent extends Record<string, any>> {
	private timeoutListener: Listener<() => void> = new Listener<() => void>();

	private triggerListeners: Record<string, Listener<(data: any) => void>> = {};

	trigger<TKey extends keyof TEvent & string>(type: TKey, data: TEvent[TKey]): void {
		if (!this.triggerListeners[type]) {
			this.triggerListeners[type] = new Listener<(data: TEvent[TKey]) => void>();
		}
		this.triggerListeners[type].call(data);
	}

	onTimeout(callback: () => void): number {
		return this.timeoutListener.addListener(callback);
	}

	clearOnTimeout(): void {
		this.timeoutListener.clear();
	}

	removeOnTimeout(key: number): void {
		this.timeoutListener.removeListener(key);
	}

	onTrigger<TKey extends keyof TEvent & string>(
		type: TKey,
		callback: (data: TEvent[TKey]) => void
	): void {
		if (!this.triggerListeners[type]) {
			this.triggerListeners[type] = new Listener<(data: TEvent[TKey]) => void>();
		}
		this.triggerListeners[type].addListener(callback);
	}

	protected timeout() {
		this.timeoutListener.call();
	}
}
