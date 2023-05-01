import type { Socket } from 'socket.io';
import type { PlayerInfo } from '../lobby/types';

export default class Player {
	registered: boolean = false;

	get isHost(): boolean {
		return this.playerInfo.role === 'host';
	}

	constructor(public playerInfo: PlayerInfo, public socket: Socket | null) {}

	get isConnected(): boolean {
		return this.socket !== null;
	}

	updateSocket(socket: Socket) {
		this.socket = socket;
	}
}
