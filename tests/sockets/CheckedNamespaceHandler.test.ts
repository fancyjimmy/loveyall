import {afterAll, describe, expect} from 'vitest';
import {Server, Socket} from 'socket.io';
import Client, {Socket as ClientSocket} from 'socket.io-client';
import {asyncBeforeEach, asyncTest} from '../util/asyncTesting';
import {createServer} from 'http';
import CheckedNamespaceHandler from '../../src-socket-io/lib/socket/CheckedNamespaceHandler';
import zod from 'zod';

const athleteSchema = zod.tuple([
    zod.string(), // name
    zod.number(), // jersey number
    zod.function().args(zod.string(), zod.number()).returns(zod.void())
]);

const minMessage = 'minimum of 5';
const notEndsWithMessage = 'has to end with test';

const mood = zod.object({
    validated: zod.object({
        name: zod.string().endsWith('test', {message: notEndsWithMessage}),
        other: zod.number().min(5, {message: minMessage})
    }),
    callback: athleteSchema,
    fail: zod.object({
        count: zod.number().min(5, {message: minMessage})
    })
});
type Mood = zod.infer<typeof mood>;

const firstParam = 'One';
const secondParam = 2;

class TestHandler extends CheckedNamespaceHandler<typeof mood> {
    public serverErrors: Error[] = [];
    public parserErrors: Error[] = [];
    public notLetIn: boolean = false;

    constructor(io: Server) {
        super(
            'test',
            io,
            mood,
            {
                validated: ({name, other}, socket, io) => {
                    socket.emit('name', name);
                    socket.emit('other', other);
                },
                callback: ([name, other, cb], socket, io) => {
                    socket.emit('name', name);
                    socket.emit('other', other);
                    cb(firstParam, secondParam);
                },
                fail: ({count}, socket, io) => {
                    throw new Error('Server fail');
                }
            },
            {
                onConnection: (socket, io) => {
                    if (socket.handshake.auth.token === "hello") {
                        console.log("hi");
                        socket.disconnect();
                        this.notLetIn = true;
                        return false;
                    }
                    console.log("ho");
                    this.notLetIn = false;
                    return true;
                },
                onDisconnect: (socket, io) => {
                    console.log('disconnect');
                    this.onDisconnect();
                },
                onParseError: (error, socket, io) => {
                    this.parserErrors.push(error);
                    socket.emit('parseError', error.message);
                    console.error(error);
                },
                onServerError: (error, socket, io) => {
                    this.serverErrors.push(error);
                    socket.emit('serverError', error.message);
                    console.error(error);
                }
            }
        );
    }

    public onDisconnect: () => void = () => {
    };
}

describe('Checked Namespace Handler Test', () => {
    let io: Server;
    let serverSocket: Socket;
    let testHandler: TestHandler;
    let clientSocket: ClientSocket;
    let url: string;

    asyncBeforeEach((done) => {
        const httpServer = createServer();
        io = new Server(httpServer);
        httpServer.listen(() => {
            // @ts-ignore
            const port = httpServer.address().port;
            io.on('connection', (socket) => {
                serverSocket = socket;
            });

            testHandler = new TestHandler(io);
            testHandler.register();
            url = `http://localhost:${port}/test`;
            clientSocket = Client(url);
            clientSocket.on('connect', done);
        });
    });

    afterAll(() => {
        testHandler.unregister(true);
        io.close();
        clientSocket.close();
    });

    describe('Validated', () => {
        asyncTest(
            'validated works as intended',
            (done) => {
                var count = 2;
                let chosenName = 'Hello World test';
                let chosenOther = 5;
                clientSocket.on('name', (returned) => {
                    expect(returned).toBe(chosenName);
                    count -= 1;
                    if (count === 0) {
                        done();
                    }
                });

                clientSocket.on('other', (returned) => {
                    expect(returned).toBe(chosenOther);
                    count -= 1;
                    if (count === 0) {
                        done();
                    }
                });

                clientSocket.emit('validated', {name: chosenName, other: chosenOther});
            },
            {
                timeout: 1000 * 10
            }
        );

        asyncTest(
            'Validated throws error if not endswith test',
            (done) => {
                let chosenName = 'Hello World';
                let chosenOther = 5;

                clientSocket.on('parseError', (returned) => {
                    expect(returned.includes(notEndsWithMessage)).toBeTruthy();
                    done();
                });

                clientSocket.emit('validated', {name: chosenName, other: chosenOther});
            },
            {
                timeout: 1000 * 10
            }
        );

        asyncTest(
            'Validated doesnt throws error if extra attribute',
            (done) => {
                let chosenName = 'Hello World test';
                let chosenOther = 5;

                clientSocket.on('name', (returned) => {
                    expect(returned).toBe(chosenName);
                    done();
                });

                clientSocket.emit('validated', {name: chosenName, other: chosenOther, extra: true});
            },
            {
                timeout: 1000 * 10
            }
        );

        asyncTest(
            'Validated throws error if not min under 5',
            (done) => {
                let chosenName = 'Hello World test';
                let chosenOther = 4;

                clientSocket.on('parseError', (returned) => {
                    expect(returned.includes(minMessage)).toBeTruthy();
                    done();
                });

                clientSocket.emit('validated', {name: chosenName, other: chosenOther});
            },
            {
                timeout: 1000 * 10
            }
        );

        asyncTest(
            'Validated throws error if not object is send',
            (done) => {
                let chosenName = 'Hello World test';
                let chosenOther = 4;

                clientSocket.on('parseError', (returned) => {
                    expect(returned.includes('array')).toBeTruthy();
                    done();
                });

                clientSocket.emit('validated', chosenName, chosenOther);
            },
            {
                timeout: 1000 * 10
            }
        );
    });

    describe('callback', function () {
        asyncTest(
            'callback works as intended',
            (done) => {
                var count = 3;
                let chosenName = 'Hello World test';
                let chosenOther = 5;
                clientSocket.on('name', (returned) => {
                    expect(returned).toBe(chosenName);
                    count -= 1;
                    if (count === 0) {
                        done();
                    }
                });

                clientSocket.on('other', (returned) => {
                    expect(returned).toBe(chosenOther);
                    count -= 1;
                    if (count === 0) {
                        done();
                    }
                });

                clientSocket.emit('callback', chosenName, chosenOther, (first: string, second: number) => {
                    expect(first).toBe(firstParam);
                    expect(second).toBe(secondParam);
                    count -= 1;
                    if (count === 0) {
                        done();
                    }
                });
            },
            {
                timeout: 1000 * 10
            }
        );

        asyncTest(
            'callback works when function has wrong type',
            (done) => {
                var count = 3;
                let chosenName = 'Hello World test';
                let chosenOther = 5;
                clientSocket.on('name', (returned) => {
                    expect(returned).toBe(chosenName);
                    count -= 1;
                    if (count === 0) {
                        done();
                    }
                });

                clientSocket.on('other', (returned) => {
                    expect(returned).toBe(chosenOther);
                    count -= 1;
                    if (count === 0) {
                        done();
                    }
                });

                clientSocket.emit('callback', chosenName, chosenOther, (first: number, second: number) => {
                    expect(first).toBe(firstParam);
                    expect(second).toBe(secondParam);
                    count -= 1;
                    if (count === 0) {
                        done();
                    }
                });
            },
            {
                timeout: 1000 * 10
            }
        );

        asyncTest(
            "callback won't work when too little params ",
            (done) => {
                var count = 3;
                let chosenName = 'Hello World test';
                let chosenOther = 5;
                clientSocket.on('parseError', (returned) => {
                    expect(true).toBeTruthy();
                    done();
                });

                clientSocket.emit('callback', (first: string, second: number) => {
                    console.log("shouldn't happen");
                });
            },
            {
                timeout: 1000 * 10
            }
        );

        asyncTest(
            "callback won't work when params wrong order ",
            (done) => {
                let chosenName = 'Hello World test';
                let chosenOther = 5;
                clientSocket.on('parseError', (returned) => {
                    expect(true).toBeTruthy();
                    done();
                });

                clientSocket.emit('callback', chosenOther, chosenName, (first: string, second: number) => {
                    console.log("shouldn't happen");
                });
            },
            {
                timeout: 1000 * 10
            }
        );

        asyncTest(
            "callback won't work when object instead of array ",
            (done) => {
                let chosenName = 'Hello World test';
                let chosenOther = 5;
                clientSocket.on('parseError', (returned) => {
                    expect(true).toBeTruthy();
                    done();
                });

                clientSocket.emit('callback', {chosenOther, chosenName}, (first: string, second: number) => {
                    console.log("shouldn't happen");
                });
            },
            {
                timeout: 1000 * 10
            }
        );
    });


    describe("fail", () => {
        asyncTest(
            "fail sends serverError",
            (done) => {
                clientSocket.on('serverError', (returned) => {
                    expect(true).toBeTruthy();
                    done();
                });

                clientSocket.emit('fail', {count: 7});
            },
            {
                timeout: 1000 * 10
            }
        );

        asyncTest(
            "fail sends parseError if it doesn't meet first condition",
            (done) => {
                clientSocket.on('parseError', (returned) => {
                    expect(true).toBeTruthy();
                    done();
                });
                clientSocket.on('serverError', (returned) => {
                    expect(true).toBeFalsy();
                    done();
                });

                clientSocket.emit('fail', {count: 1});
            },
            {
                timeout: 1000 * 10
            }
        );
    });

    describe("onConnection works", () => {
        asyncTest("preventsConnection", (done) => {

            let newClientSocket = Client(url, {
                auth: {
                    token: "hello"
                }
            });

            newClientSocket.on("disconnect", () => {
                expect(true).toBeTruthy();
                done();
            });
        })

        asyncTest("doesn't disconnect if not if not", (done) => {

            let newClientSocket = Client(url, {
                auth: {
                    token: "hell"
                }
            });

            setTimeout(() => {
                done();
                expect(true).toBeTruthy();
            }, 9000);

            newClientSocket.on("disconnect", () => {
                expect(false).toBeTruthy();
                done();
            });
        }, {timeout: 10000})

    })

    /* TODO check if it is because it just sucks
    describe("onDisconnect works", () => {
        asyncTest("preventsConnection", (done) => {



            testHandler.onDisconnect = () => {
                expect(true).toBeTruthy();
                done();

            };

            let newClientSocket = Client(url);

            newClientSocket.close();
        }, {timeout: 10000});
    })

     */
});
