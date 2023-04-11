export type LogOptions = {
    extra?: any;
    extraFormat?: string;
    code?: number;
    count?: number;
    severity?: number;
    metaData?: string
}

export class Log {

    message: string = "";
    time: Date = new Date();
    type: string = "";


    options: LogOptions = {};

    constructor(type: string, message: string, options?: LogOptions) {
        this.type = type;
        this.message = message;
        this.options = options ?? {};
    }

    show() {
        console.log(`[${this.time.toLocaleTimeString()}] ${this.type}: ${this.message}`);
        if (this.options.extra) {
            console.log(this.options.extra);
        }
    }


}


export const logger = {
    logs: [] as Log[],
    count: 0,

    log: (type: string, message: string, options?: LogOptions) => {

        logger.count++;
        const log = new Log(type, message, {...options, count: logger.count, metaData: new Error().stack});
        logger.listeners.forEach(func => func(log));
        logger.logs.push(log);
    },
    show: (grouping: string) => {
        const logs = logger.grouping(grouping);
        if (logs) {
            console.log('-----------------------------------------');
            console.log(`Grouping: ${grouping}`);
            console.log('-----------------------------------------');
            for (let i = 0; i < logs.length; i++) {
                const log = logs[i];
                log.show();
            }
        }
        return logs;
    },

    clear: (grouping: string) => {
        logger.logs = logger.logs.filter(log => log.type !== grouping);
    },

    grouping: (grouping: string, count: number = -1) => {
        if (count > 0) {
            let countFromEnd = logger.logs.length - count < 0 ? 0 : logger.logs.length - count;
            return logger.logs.filter(log => log.type === grouping).slice(countFromEnd);
        }
        return logger.logs.filter(log => log.type === grouping);
    },
    listeners: [] as ((log: Log) => void)[],

    listen: (func: (log: Log) => void) => {
        logger.listeners.push(func);
    },

    unListen: (func: (log: Log) => void) => {
        logger.listeners = logger.listeners.filter(f => f !== func);
    }

};
