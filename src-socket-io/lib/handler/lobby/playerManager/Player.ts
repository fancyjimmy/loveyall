import type { Socket } from 'socket.io';
import type { PlayerInfo } from '../types';
import type PlayerTimeoutPolicy from '../policy/time/player/PlayerTimeoutPolicy';
import { Listener } from '../../../utilities/Listener';

export default class Player {
	registered: boolean = false;

	get isHost(): boolean {
		return this.playerInfo.role === 'host';
	}

	// TODO unclean refactor Listener, dry it
	private disconnectListener = new Listener();

	private gameState: 'initializing' | 'playing' | 'lobby' = 'lobby';

	get isConnected(): boolean {
		return this.socket !== null;
	}

	private reconnectListener = new Listener();
	private timeoutListener = new Listener();

	get state(): 'initializing' | 'playing' | 'lobby' {
		return this.gameState;
	}

	get isPlaying(): boolean {
		return this.gameState === 'playing';
	}

	get isWaiting(): boolean {
		return this.gameState === 'lobby';
	}

	get isInitializing(): boolean {
		return this.gameState === 'initializing';
	}

	public setGameState(state: 'initializing' | 'playing' | 'lobby') {
		this.gameState = state;
	}

	constructor(
		public readonly timeout: PlayerTimeoutPolicy,
		public playerInfo: PlayerInfo,
		public socket: Socket | null
	) {
		timeout.onTimeout(() => {
			this.timeoutListener.call();
		});
	}

	updateSocket(socket: Socket | null) {
		this.socket = socket;

		if (socket === null) {
			this.timeout.trigger('disconnect', null);
			this.disconnectListener.call();
		} else {
			this.timeout.trigger('bind', null);
			this.reconnectListener.call();
		}
	}

	onDisconnect(listener: () => void): number {
		return this.disconnectListener.addListener(listener);
	}

	removeDisconnectListener(id: number): void {
		this.disconnectListener.removeListener(id);
	}

	onReconnect(listener: () => void): number {
		return this.reconnectListener.addListener(listener);
	}

	removeReconnectListener(id: number): void {
		this.reconnectListener.removeListener(id);
	}

	onTimeout(listener: () => void): number {
		return this.timeoutListener.addListener(listener);
	}

	removeTimeoutListener(id: number): void {
		this.timeoutListener.removeListener(id);
	}
}
