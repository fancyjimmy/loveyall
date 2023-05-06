import { StateFullGame } from '../../../../../../../src-socket-io/lib/handler/game/statefull/StateFullGame';
import type LobbyHandler from '../../../../../../../src-socket-io/lib/handler/lobby/LobbyHandler';
import type Player from '../../../../../../../src-socket-io/lib/handler/lobby/playerManager/Player';
import type { ZTypeRacerSettings } from './types';
import type { z } from 'zod';
import TypeRacerStartState from './TypeRacerStartState';

export class TypeRacer extends StateFullGame<TypeRacer> {
	public readonly settings: z.infer<typeof ZTypeRacerSettings>;
	public readonly roomName: string = 'typeracer';

	constructor(
		public readonly lobbyHandler: LobbyHandler,
		players: Player[],
		settings: z.infer<typeof ZTypeRacerSettings>
	) {
		super(players, new TypeRacerStartState());
		this.players.forEach((player) => {
			const listener = () => {
				if (player.isHost) {
					this.end();
				}
			};
			player.activeSocket.once('end', listener);
			player.activeSocket.removeListener('end', listener);
		});
		this.settings = settings;
	}

	get room() {
		return this.namespace.to(this.roomName);
	}

	get namespace() {
		return this.lobbyHandler.namespace;
	}

	joinRoom(players: Player[], name: string = this.roomName) {
		players.forEach((player) => {
			player.activeSocket.join(name);
		});
		this.onEnd(() => {
			players.forEach((player) => {
				player.activeSocket.leave(name);
			});
		});
	}
}
