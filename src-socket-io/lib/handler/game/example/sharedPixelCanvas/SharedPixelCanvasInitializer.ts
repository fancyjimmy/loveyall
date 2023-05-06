import GameInitializer from '../../GameInitializer';
import type { SharedPixelCanvasSettings } from './types';
import SharedPixelCanvas from './SharedPixelCanvas';
import type Player from '../../../lobby/playerManager/Player';

export default class SharedPixelCanvasInitializer extends GameInitializer<
	SharedPixelCanvas,
	SharedPixelCanvasSettings,
	{ minPlayers: 1; maxPlayers: null }
> {
	constructor() {
		super(SharedPixelCanvas, { minPlayers: 1, maxPlayers: null });
	}

	name = 'pixel';

	loadGameConfig(sockets: Player[], host: Player): Promise<SharedPixelCanvasSettings> {
		return new Promise<SharedPixelCanvasSettings>((resolve, reject) => {
			host.activeSocket.once('createCanvas', (settings: SharedPixelCanvasSettings) => {
				resolve(settings);
			});

			host.onTimeout(() => {
				reject('cancelled');
			});
		});
	}
}
