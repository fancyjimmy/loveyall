export type ConsoleListener = (type: string | symbol, time: Date, ...args: any[]) => void;

let showLogs = true;

export class Logger {
    private listeners: ConsoleListener[] = [];


    proxy(console: Console) {
        let listeners = this.listeners
        return new Proxy(console, {
            get(target: typeof console, methodName: keyof typeof console, receiver) {
                // get origin method
                const originMethod = target[methodName];

                return function (...args: any[]) {
                    listeners.forEach(listener => {
                        listener(methodName, new Date(), ...args);
                    });
                    // @ts-ignore
                    return originMethod.apply(this, args);
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