import type Player from './Player';

export default interface Game {
	registerPlayer(player: Player): void;

	register(): void;

	get players(): Player[];
}
