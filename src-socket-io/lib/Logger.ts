export type ConsoleListener = (type: string | symbol, time: Date, ...args: any[]) => void;

export class Logger {
	public showLogs = true;
	private listeners: ConsoleListener[] = [];

	proxy(console: Console) {
		let listeners = this.listeners;
		let self = this;
		return new Proxy(console, {
			get(target: typeof console, methodName: keyof typeof console, receiver) {
				// get origin method
				const originMethod = target[methodName];

				return function (...args: any[]) {
					listeners.forEach((listener) => {
						listener(methodName, new Date(), ...args.map((arg) => JSON.stringify(arg)));
					});

					if (self.showLogs) {
						// @ts-ignore
						return originMethod.apply(this, args);
					}
				};
			}
		});
	}

	listen(consoleListener: ConsoleListener) {
		this.listeners.push(consoleListener);
	}

	clear() {
		this.listeners = [];
	}
}

const logger = new Logger();

export default logger;
