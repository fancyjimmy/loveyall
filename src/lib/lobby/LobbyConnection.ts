import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

const sockets: { [lobbyId: string]: Socket } = {};

export function getLobbyConnection(lobbyId: string, sessionKey: string): Socket {
	if (sockets[lobbyId] === undefined) {
		sockets[lobbyId] = io(`/lobby/${lobbyId}`, {
			auth: {
				token: sessionKey
			}
		});
	}
	return sockets[lobbyId];
}
