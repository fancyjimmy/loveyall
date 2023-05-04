import GameInitializer from '../../GameInitializer';
import type { SharedPixelCanvasSettings } from './types';
import SharedPixelCanvas from './SharedPixelCanvas';
import type LobbyHandler from '../../../lobby/LobbyHandler';
import type Player from '../../../lobby/playerManager/Player';

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

	loadGameConfig(sockets: Player[], host: Player): Promise<SharedPixelCanvasSettings> {
		return new Promise<SharedPixelCanvasSettings>((resolve, reject) => {
			setTimeout(() => {
				resolve({
					width: 30,
					height: 30
				});
			}, 5000);
		});
	}
}
