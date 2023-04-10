import {Server} from 'socket.io';
import type {Server as HttpServer} from 'http';


import {ServerChatHandler, ServerChatRoomHandler} from "./lib/chat";
import {DebugHandler} from "./lib/debug";


const serverHandlers = [
    new ServerChatHandler("general", false),
    new ServerChatRoomHandler(),
    new DebugHandler(),
]


export default function injectSocketIO(server: HttpServer) {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST'],
        }
    });


    io.on('connection', (socket) => {
        serverHandlers.forEach(handler => {
                handler.registerSocket(io, socket);
            }
        );


    });

    console.log('SocketIO injected');
}
