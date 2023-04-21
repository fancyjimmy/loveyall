import {ServerHandler} from '../../socket/ServerHandler';
import type {Server, Socket} from 'socket.io';
import logger from '../../Logger';

type Debug = {
    listen: null;
    unListen: null;
    run: {
        command: string;
        runDangerously: boolean;
    };
};

export class DebugHandler extends ServerHandler<Debug> {
    public listenCount = 0;
    private roomName = 'debug';

    constructor() {
        super('debug', {
            run: ({command, runDangerously}, socket, io) => {
                if (runDangerously) {
                    try {
                        //TODO remove in Production FR FR VERI IMPORTANTO
                        const result = eval(command);
                        console.log(result);
                    } catch (e) {
                        if (e instanceof Error) {
                            console.error(e.name, e.message);
                        }
                    }
                }
            },
            listen: (data: null, socket, io) => {
                socket.join(this.roomName);
                if (this.listenCount === 0) {
                    logger.listen((type, time, ...args: any[]) => {
                        this.emitConsole(io, type, time, ...args);
                    });
                }
                this.listenCount++;
            },
            unListen: (data: null, socket, io) => {
                socket.leave(this.roomName);
                this.listenCount--;
                if (this.listenCount === 0) {
                    logger.clear();
                }
            }
        });
    }

    emitConsole(io: Server, type: string | symbol, time: Date, ...args: any[]) {
        io.to(this.nameSpace).emit('console', type, time, ...args);
    }

    emitError(socket: Socket, message: string) {
        socket.emit('debugError', message);
    }
}
