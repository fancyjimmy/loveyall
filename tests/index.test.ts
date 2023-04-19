import {createServer} from "http";
import Client, {Socket as ClientSocket} from "socket.io-client";
import {Server, Socket as ServerSocket} from "socket.io";
import {afterAll, describe, expect} from "vitest";
import {asyncBeforeEach, asyncTest} from "./util/asyncTesting";

describe("my awesome project", () => {
    let io: Server, serverSocket: ServerSocket, clientSocket: ClientSocket;

    asyncBeforeEach((done) => {
        const httpServer = createServer();
        io = new Server(httpServer);
        httpServer.listen(() => {
            // @ts-ignore
            const port = httpServer.address().port;
            clientSocket = Client(`http://localhost:${port}`);
            io.on("connection", (socket) => {
                serverSocket = socket;
            });
            clientSocket.on("connect", done);
        });
    });

    afterAll(() => {
        io.close();
        clientSocket.close();
    });
    asyncTest("should work", (done) => {
        clientSocket.on("hello", (arg) => {
            done();
            expect(arg).toBe("world");
            console.log(arg);
        });
        serverSocket.emit("hello", "world");
    });

    asyncTest("should work (with ack)", (done, context) => {
        serverSocket.on("hi", (cb) => {
            cb("hola");
        });
        clientSocket.emit("hi", (arg: any) => {
            done();
            expect(arg).toBe("hola");
            console.log(arg);

        });
    }, {timeout: 10000});
});