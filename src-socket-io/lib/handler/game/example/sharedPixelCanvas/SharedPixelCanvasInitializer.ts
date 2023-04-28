import GameInitializer from '../../GameInitializer';
import type { SharedPixelCanvasSettings } from './types';
import SharedPixelCanvas from './SharedPixelCanvas';
import type LobbyHandler from '../../../lobby/LobbyHandler';
import type { PlayerInfo } from '../../../lobby/types';

export default class SharedPixelCanvasInitializer extends GameInitializer<
	SharedPixelCanvas,
	SharedPixelCanvasSettings,
	{ minPlayers: 1; maxPlayers: null }
> {
	name = 'pixel';
	description = 'A shared pixel canvas';

	constructor(lobbyManager: LobbyHandler) {
		super(lobbyManager, SharedPixelCanvas, { minPlayers: 1, maxPlayers: null });
	}

	loadGameConfig(sockets: PlayerInfo[], host: PlayerInfo): Promise<SharedPixelCanvasSettings> {
		return new Promise<SharedPixelCanvasSettings>((resolve, reject) => {
			resolve({
				width: 100,
				height: 100
			});
		});
	}
}
