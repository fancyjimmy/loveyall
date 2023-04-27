import type Game from './Game';
import type { GameRequirements, SocketWithPlayer } from './types';
import type { Class } from '../../../types';
import type { LobbyHandler } from '../lobby/LobbyHandler';

export default abstract class GameInitializer<
	TGameOptions,
	TGameRequirements extends GameRequirements,
	TGame extends Game<any, TGameOptions, TGameRequirements>
> {
	public readonly requirements: TGameRequirements;
	public readonly description: string = '';
	public readonly name: string = '';
	private gameClass: Class<TGame, [LobbyHandler, SocketWithPlayer[], TGameOptions]>;

	protected constructor(
		gameClass: Class<TGame, [LobbyHandler, SocketWithPlayer[], TGameOptions]>,
		requirements: TGameRequirements
	) {
		this.requirements = requirements;
		this.gameClass = gameClass;
	}

	public abstract loadGameConfig(
		sockets: SocketWithPlayer[],
		host: SocketWithPlayer
	): Promise<TGameOptions>;

	// returns started Game
	public abstract startGame(
		lobbyHandler: LobbyHandler,
		sockets: SocketWithPlayer[],
		config: TGameOptions
	): Promise<TGame>;
}
