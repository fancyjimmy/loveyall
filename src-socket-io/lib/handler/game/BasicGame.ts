import type { z } from 'zod';
import type Player from '../lobby/playerManager/Player';
import ClientError from '../../ClientError';
import type Game from './Game';
import type { GameHandler, PlayerEvents } from './types';
import { Listener } from '../../utilities/Listener';

export default abstract class BasicGame<ZHandler extends z.ZodObject<Record<string, any>>>
	implements Game
{
	protected constructor(
		public readonly name: string,
		public readonly validator: ZHandler,
		protected handler: GameHandler<z.infer<ZHandler>>,
		protected events: PlayerEvents
	) {}

	abstract get players(): Player[];

	registerPlayer = (player: Player) => {
		if (!player.isConnected) {
			return;
		}
		for (let key in this.handler) {
			const handlerValidator = this.validator.shape[key];
			player.socket?.join(this.name);
			player.socket?.on(`${this.name}:${key}`, (...args: any[]) => {
				let parameter;
				if (args.length <= 1) {
					parameter = handlerValidator.safeParse(args[0]);
				} else {
					parameter = handlerValidator.safeParse(args);
				}
				if (!parameter.success) {
					const error = parameter.error;
					this.emitError(player, new ClientError(error));
					return;
				}
				try {
					this.handler[key](parameter.data, player);
				} catch (error) {
					this.emitError(player, error);
				}
			});
		}
	};

	private endListener = new Listener();

	register() {
		this.players.forEach((player) => {
			const disconnectListener = player.onDisconnect(() => this.events.disconnect(player));
			const reconnectListener = player.onReconnect(() => this.events.reconnect(player));
			this.onEnd(() => {
				player.removeDisconnectListener(disconnectListener);
				player.removeReconnectListener(reconnectListener);
			});
		});
		this.players.forEach(this.registerPlayer);
	}

	onEnd(callback: () => void): void {
		this.endListener.addListener(callback);
	}

	unregister(): void {
		this.players.forEach((player) => {
			this.unregisterPlayer(player);
		});
	}

	unregisterPlayer(player: Player): void {
		player.socket?.leave(this.name);

		Object.keys(this.handler).forEach((key) => {
			player.socket?.removeAllListeners(`${this.name}:${key}`);
		});
	}

	protected end(): void {
		this.endListener.call();
		this.unregister();
	}

	private emitError(player: Player, error: any) {
		console.error(error);
		if (error instanceof ClientError) {
			player.socket?.emit('error', error.message);
		} else if (error instanceof Error) {
			player.socket?.emit('error', error.message);
		}
	}
}
