import {Server} from 'socket.io';
import type {Server as HttpServer} from 'http';


import {ServerChatHandler, ServerChatRoomHandler} from "./lib/chat";
import {DebugHandler} from "./lib/debug";
import {LobbyManagerHandler} from "./lib/lobby/LobbyManagerHandler";


const serverHandlers = [
    new ServerChatRoomHandler(),
    new DebugHandler(),
    new LobbyManagerHandler(),
]


export default function injectSocketIO(server: HttpServer) {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST'],
        }
    });

    const serverChatHandler = new ServerChatHandler(io, "general", false)

    const chatRoomNamespace = io.of("/chat/general");
    serverChatHandler.registerForEverySocket(chatRoomNamespace);

    io.on('connection', (socket) => {
        serverHandlers.forEach(handler => {
                handler.registerSocket(io, socket);
            }
        );
    });

    console.log('SocketIO injected');
}
