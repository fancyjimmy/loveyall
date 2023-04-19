import {afterAll, describe} from "vitest";
import {Server, Socket} from "socket.io";
import Client, {Socket as ClientSocket} from "socket.io-client";
import {asyncBeforeEach} from "../../util/asyncTesting";
import {createServer} from "http";

describe("my awesome project", () => {
    let io: Server;
    let serverSocket: Socket;
    let clientSocket: ClientSocket;

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
});