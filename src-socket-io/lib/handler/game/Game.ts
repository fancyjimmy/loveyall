import type Player from '../lobby/playerManager/Player';

export default interface Game {
	registerPlayer(player: Player): void;

	register(): void;

	unregister(): void;

	unregisterPlayer(player: Player): void;

	get players(): Player[];

	onEnd(callback: () => void): void;
}
