import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

const sockets: { [lobbyId: string]: Socket } = {};

export function setSessionStorage(key: string, value: string) {
	sessionStorage.setItem(`${LOBBY_SESSION_KEY}${data.lobbyId}${key}`, value);
}

export function getSessionStorage(key: string): string | null {
	return sessionStorage.getItem(`${LOBBY_SESSION_KEY}${data.lobbyId}${key}`);
}

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
