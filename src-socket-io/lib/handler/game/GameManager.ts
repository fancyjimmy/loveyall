import type GameInitializer from './GameInitializer';

export default class GameManager {
	private games: GameInitializer<any>[] = [];

	constructor() {}

	addGame(gameInitializer: GameInitializer<any>) {
		this.games.push(gameInitializer);
	}

	getGameInitializer(gameName: string): GameInitializer<any> | undefined {
		return this.games.find((game) => game.name === gameName);
	}
}
