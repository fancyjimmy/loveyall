import type Player from '../lobby/playerManager/Player';

export default interface Game {
	registerPlayer(player: Player): void;

	register(): void;

	get players(): Player[];

	onEnd(callback: () => void): void;
}
