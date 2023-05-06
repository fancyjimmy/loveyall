import type Player from '../lobby/playerManager/Player';

export default interface Game {
	start(): void;

	get players(): Player[];

	onEnd(callback: () => void): void;
}
