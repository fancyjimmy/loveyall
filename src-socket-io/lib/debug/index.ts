import {ServerHandler} from "../socket/ServerHandler";
import {Log, logger} from "../Logging";
import type {Socket} from "socket.io";

type Debug = {
    get: string;
}

const commands: { [commandName: string]: any } = {
    clear: (grouping: string) => {
        logger.clear(grouping);
    },
    clearSeverity: (severity: string) => {
        let severityValue = parseInt(severity);
        if (isNaN(severityValue)) {
            throw Error("Invalid severity value");
        }
        logger.logs = logger.logs.filter(log => log.options.severity !== severityValue);
    },
    show: (grouping: string, count: string) => {
        let countValue = parseInt(count);
        if (isNaN(countValue)) {
            countValue = 20;
        }
        return logger.grouping(grouping, countValue);
    },
    clearAll: () => {
        logger.logs = [];
    },
    showAll: () => {
        return logger.logs;
    },
    matches: (grouping: string, code: string, severity: string,) => {
        let codeValue = parseInt(code);
        if (isNaN(codeValue)) {
            codeValue = -1;
        }
        let severityValue = parseInt(severity);
        if (isNaN(severityValue)) {
            severityValue = -1;
        }
        return logger.logs.filter(log => log.type.startsWith(grouping) || log.options.code === codeValue || (log.options.severity ?? 0) < severityValue);
    },
    help: () => {
        throw new Error(
            "Commands:\n" +
            "clear <grouping>\n" +
            "clearSeverity <severity>\n" +
            "show <grouping> <count>\n" +
            "clearAll\n" +
            "showAll\n" +
            "matches <grouping> <code> <severity>\n" +
            "help\n"
        );
    }
}

export class DebugHandler extends ServerHandler<Debug> {
    constructor() {
        super("debug", {
            get: (command, socket, io) => {
                let parts = command.split(" ");
                let commandName = parts[0].trim();
                if (Object.keys(commands).includes(commandName)) {
                    try {
                        let commandFunction: any = commands[commandName];
                        let data = commandFunction(...parts.slice(1)) ?? [];
                        this.emitLogs(socket, data)
                    } catch (e) {
                        if (e instanceof Error) {
                            this.emitError(socket, e.message);
                        } else {
                            this.emitError(socket, JSON.stringify(e));
                        }
                    }
                }


                if (command.startsWith("listen")) {
                    logger.listen((log: Log) => {
                        if (socket.rooms.has(this.nameSpace)) {
                            this.emitLogUpdate(socket, log);
                        }
                    });
                    socket.join(this.nameSpace);
                }
                if (command.startsWith("unlisten")) {
                    socket.leave(this.nameSpace);
                }

            }
        });
    }

    emitLogs(socket: Socket, logs: Log[]) {
        socket.emit("debug", logs);
    }

    emitLogUpdate(socket: Socket, log: Log) {
        socket.emit("debugUpdate", log);
    }

    emitError(socket: Socket, message: string) {
        socket.emit("debugError", message);
    }
}