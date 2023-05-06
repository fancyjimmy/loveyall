import type { z } from 'zod';
import type Player from '../../../../../../../src-socket-io/lib/handler/lobby/playerManager/Player';
import GameInitializer from '../../../../../../../src-socket-io/lib/handler/game/GameInitializer';
import type { ZTypeRacerSettings } from './types';
import { TypeRacer } from './TypeRacer';

export class TypeRacerInitializer extends GameInitializer<
	TypeRacer,
	z.infer<typeof ZTypeRacerSettings>,
	{ minPlayers: 2; maxPlayers: null }
> {
	name = 'typewriter';

	constructor() {
		super(TypeRacer, { minPlayers: 2, maxPlayers: null });
	}

	loadGameConfig(players: Player[], host: Player): Promise<z.infer<typeof ZTypeRacerSettings>> {
		return new Promise<z.infer<typeof ZTypeRacerSettings>>((resolve, reject) => {
			host.activeSocket.once('settings', (time: number) => {
				resolve({ time });
			});

			host.onTimeout(() => {
				reject('cancelled');
			});
		});
	}
}
