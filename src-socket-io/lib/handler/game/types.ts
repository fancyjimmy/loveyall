import type { Socket } from 'socket.io';
import type { PlayerInfo } from '../lobby/types';

export type GameRequirements = {
	minPlayers: number;
	maxPlayers: number | null;
};

export type SocketWithPlayer = Socket<any, any, any, PlayerInfo>;
