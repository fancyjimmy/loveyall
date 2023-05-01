import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { LOBBY_SESSION_KEY } from '../constants';

const sockets: { [lobbyId: string]: Socket } = {};

export function setSessionStorage(lobbyId: string, key: string, value: string) {
	sessionStorage.setItem(`${LOBBY_SESSION_KEY}${lobbyId}${key}`, value);
}

export function getSessionStorage(lobbyId: string, key: string): string | null {
	return sessionStorage.getItem(`${LOBBY_SESSION_KEY}${lobbyId}${key}`);
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
