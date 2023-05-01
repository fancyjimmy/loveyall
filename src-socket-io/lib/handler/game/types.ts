import type { Socket } from 'socket.io';
import type { PlayerInfo } from '../lobby/types';
import type Player from '../lobby/playerManager/Player';

export type GameRequirements = {
	minPlayers: number;
	maxPlayers: number | null;
};

export type SocketWithPlayer = Socket<any, any, any, PlayerInfo>;

export type GameHandler<ZHandler> = {
	[key in keyof ZHandler & string]: (data: ZHandler[key], player: Player) => void;
};

export type PlayerEvents = {
	disconnect: (player: Player) => void;
	reconnect: (player: Player) => void;
};
