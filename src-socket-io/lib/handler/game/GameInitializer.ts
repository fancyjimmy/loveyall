import type { GameRequirements } from './types';
import type { Class } from '../../../types';
import type LobbyHandler from '../lobby/LobbyHandler';
import type Game from './Game';
import type Player from '../lobby/playerManager/Player';

export default abstract class GameInitializer<
	TGame extends Game,
	TGameOptions extends any = any,
	TGameRequirements extends GameRequirements = GameRequirements
> {
	public readonly requirements: TGameRequirements;
	public readonly description: string = '';
	public readonly name: string = '';
	protected gameClass: Class<TGame, [LobbyHandler, Player[], TGameOptions]>;

	protected constructor(
		gameClass: Class<TGame, [LobbyHandler, Player[], TGameOptions]>,
		requirements: TGameRequirements
	) {
		this.requirements = requirements;
		this.gameClass = gameClass;
	}

	public abstract loadGameConfig(players: Player[], host: Player): Promise<TGameOptions>;

	// returns started Game
	public startGame(lobbyHandler: LobbyHandler, players: Player[], config: TGameOptions): TGame {
		const Game = this.gameClass.bind({}, lobbyHandler, players, config);
		const game: TGame = new Game();
		game.start();

		return game;
	}
}
