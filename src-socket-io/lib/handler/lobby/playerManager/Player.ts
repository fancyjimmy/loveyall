import type { Socket } from 'socket.io';
import type { PlayerInfo } from '../types';
import { PlayerState } from '../types';
import type PlayerTimeoutPolicy from '../policy/time/player/PlayerTimeoutPolicy';
import { Listener } from '../../../utilities/Listener';
import type { EventsMap } from 'socket.io/dist/typed-events';

class ListenerIdentifier {
	constructor(public readonly id: number, public readonly listener: any) {}
}

export class ActiveSocket<TEvents extends EventsMap = any> {
	private player: Player;
	private listeners: Map<string, ListenerIdentifier[]> = new Map();
	private joinListenerIdentifier: { id: number; room: string }[] = [];

	constructor(player: Player) {
		this.player = player;
	}

	on<TKey extends keyof TEvents & string>(event: TKey, listener: TEvents[TKey]) {
		if (this.player.socket !== null) {
			this.player.socket.on(event, listener);
		}

		const id = this.player.onReconnect((socket) => {
			socket.on(event, listener);
		});

		this.addListenerIdentifier(event, id, listener);
	}

	join(room: string) {
		if (this.player.socket !== null) {
			this.player.socket.join(room);
		}

		const id = this.player.onReconnect((socket) => {
			socket.join(room);
		});

		this.joinListenerIdentifier.push({ id, room });
	}

	leave(room: string) {
		if (this.player.socket !== null) {
			this.player.socket.leave(room);
		}

		const roomIdentifier = this.joinListenerIdentifier.find(
			(identifier) => identifier.room === room
		);
		if (roomIdentifier === undefined) return;

		this.player.removeReconnectListener(roomIdentifier.id);
	}

	once<TKey extends keyof TEvents & string>(event: TKey, listener: TEvents[TKey]) {
		const newListener = ((...args: any[]) => {
			listener(...args);
			this.removeListener(event, newListener);
		}) as TEvents[TKey];

		if (this.player.socket !== null) {
			this.player.socket.once(event, newListener);
		}
		const id = this.player.onReconnect((socket) => {
			socket.once(event, newListener);
		});

		this.addListenerIdentifier(event, id, newListener);
	}

	removeListener<TKey extends keyof TEvents & string>(event: TKey, listener: TEvents[TKey]): void {
		const listenerIdentifiers = this.listeners.get(event);
		if (listenerIdentifiers === undefined) return;

		const index = listenerIdentifiers.findIndex((identifier) => identifier.listener === listener);
		if (index === -1) return;
		const listenerIdentifier = listenerIdentifiers[index];
		listenerIdentifiers.splice(index, 1);
		this.removeListenerByIdentifier(event, listenerIdentifier);
	}

	removeAllListeners<TKey extends keyof TEvents & string>(event: TKey): void {
		const listenerIdentifiers = this.listeners.get(event);
		if (listenerIdentifiers === undefined) return;

		for (const listenerIdentifier of listenerIdentifiers) {
			this.player.removeReconnectListener(listenerIdentifier.id);
		}

		this.player.socket?.removeAllListeners(event);
		this.listeners.delete(event);
	}

	private addListenerIdentifier<TKey extends keyof TEvents & string>(
		event: TKey,
		id: number,
		listener: TEvents[TKey]
	) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, [new ListenerIdentifier(id, listener)]);
		} else {
			this.listeners.get(event)!.push(new ListenerIdentifier(id, listener));
		}
	}

	private removeListenerByIdentifier<TKey extends keyof TEvents & string>(
		event: TKey,
		identifier: ListenerIdentifier
	): void {
		this.player.removeReconnectListener(identifier.id);
		this.player.socket?.removeListener(event, identifier.listener);
	}
}

export default class Player {
	registered: boolean = false;

	get isHost(): boolean {
		return this.playerInfo.role === 'host';
	}

	// TODO unclean refactor Listener, dry it
	private disconnectListener = new Listener();

	private gameState: PlayerState = PlayerState.LOBBY;

	get isConnected(): boolean {
		return this.socket !== null;
	}

	public readonly gameInfo: Record<string, any> = {};

	private timeoutListener = new Listener();

	get state(): PlayerState {
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

	public setGameState(state: PlayerState) {
		if (!['initializing', 'playing', 'lobby'].includes(state)) throw new Error('Invalid state');
		this.gameState = state;
	}

	public getGameState(): PlayerState {
		return this.gameState;
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

	#activeSocket: ActiveSocket = new ActiveSocket(this);
	private reconnectListener = new Listener<(socket: Socket) => void>();

	get activeSocket() {
		return this.#activeSocket;
	}

	onDisconnect(listener: () => void): number {
		return this.disconnectListener.addListener(listener);
	}
	updateSocket(socket: Socket | null) {
		this.socket = socket;

		if (socket === null) {
			this.timeout.trigger('disconnect', null);
			this.disconnectListener.call();
		} else {
			this.timeout.trigger('bind', null);
			this.reconnectListener.call(socket);
		}
	}
	onReconnect(listener: (socket: Socket) => void): number {
		return this.reconnectListener.addListener(listener);
	}

	onTimeout(listener: () => void): number {
		return this.timeoutListener.addListener(listener);
	}

	removeReconnectListener(id: number): void {
		this.reconnectListener.removeListener(id);
	}
	removeTimeoutListener(id: number): void {
		this.timeoutListener.removeListener(id);
	}
}
