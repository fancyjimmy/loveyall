import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

import { ServerChatHandler, ServerChatRoomHandler } from './lib/handler/chat';
import logger from './lib/Logger';
import { DebugHandler } from './lib/handler/debug';
import HandlerManager from './HandlerManager';
import LobbyManagerHandler from './lib/handler/lobby/manage/LobbyManagerHandler';

console = logger.proxy(console);

let io: Server;

export default function injectSocketIO(server: HttpServer) {
	io = new Server(server, {
		cors: {
			methods: ['GET', 'POST']
		}
	});

	const handlerManager = new HandlerManager([
		new ServerChatRoomHandler(io),
		new LobbyManagerHandler(io),
		new DebugHandler(io)
	]);

	const serverChatHandler = new ServerChatHandler(io, 'general', false);
	serverChatHandler.register();

	handlerManager.register();

	console.log('SocketIO injected');
}
