import {ServerHandler} from "../socket/ServerHandler";
import {Log, logger} from "../Logging";
import type {Socket} from "socket.io";

type Debug = {
    get: {
        command: string,
        runDangerously: boolean
    };
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
    private debugListeners: { [socketId: string]: (log: Log) => void } = {};

    constructor() {
        super("debug", {
            get: ({command, runDangerously}, socket, io) => {

                if (runDangerously) {
                    try {
                        //TODO remove in Production FR FR VERI IMPORTANTO
                        const result = eval(command);
                        this.emitLogs(socket, [new Log("command", JSON.stringify(result), {severity: 0})]);
                    } catch (e) {
                        if (e instanceof Error)
                            this.emitError(socket, e.message);
                        else
                            this.emitError(socket, JSON.stringify(e));
                    }
                    return;
                }
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
                    if (this.debugListeners[socket.id] !== undefined) {
                        this.emitError(socket, "Already listening");
                        return;
                    }
                    this.emitLogs(socket, logger.logs);
                    const listener = (log: Log) => {
                        if (socket.rooms.has(this.nameSpace)) {
                            this.emitLogUpdate(socket, log);
                        }
                    };

                    logger.listen(listener);
                    this.debugListeners[socket.id] = listener;

                    socket.join(this.nameSpace);
                }


                if (command.startsWith("unlisten")) {
                    logger.unListen(this.debugListeners[socket.id]);
                    delete this.debugListeners[socket.id];
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