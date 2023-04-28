import type { GameRequirements } from './types';
import type { Class } from '../../../types';
import type LobbyHandler from '../lobby/LobbyHandler';
import type { PlayerInfo } from '../lobby/types';
import type Game from './Game';

export default abstract class GameInitializer<
	TGame extends Game,
	TGameOptions extends any = any,
	TGameRequirements extends GameRequirements = GameRequirements
> {
	public readonly requirements: TGameRequirements;
	public readonly description: string = '';
	public readonly name: string = '';
	protected gameClass: Class<TGame, [LobbyHandler, PlayerInfo[], TGameOptions]>;

	protected constructor(
		protected lobbyHandler: LobbyHandler,
		gameClass: Class<TGame, [LobbyHandler, PlayerInfo[], TGameOptions]>,
		requirements: TGameRequirements
	) {
		this.requirements = requirements;
		this.gameClass = gameClass;
	}

	public abstract loadGameConfig(players: PlayerInfo[], host: PlayerInfo): Promise<TGameOptions>;

	// returns started Game
	public startGame(lobbyHandler: LobbyHandler, players: PlayerInfo[], config: TGameOptions): TGame {
		const Game = this.gameClass.bind({}, lobbyHandler, players, config);
		const game = new Game();
		game.register();

		return game;
	}
}
