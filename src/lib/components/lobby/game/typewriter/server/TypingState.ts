import {
	State,
	StateStack
} from '../../../../../../../src-socket-io/lib/handler/game/statefull/StateFullGame';
import type Player from '../../../../../../../src-socket-io/lib/handler/lobby/playerManager/Player';
import Timer from '../../../../../../../src-socket-io/lib/utilities/Timer';
import type { TypeRacer } from './TypeRacer';

import TypeRacerFinishState from './TypeRacerFinishState';

export default class TypingState extends State<TypeRacer> {
	constructor(public readonly text: string) {
		super();
	}

	finish(stateMachine: StateStack<TypeRacer>) {
		stateMachine.push(
			new TypeRacerFinishState(
				stateMachine.game.players.map((player) => {
					return {
						name: player.playerInfo.username,
						count: player.gameInfo['game'].count
					};
				})
			)
		);
	}

	onStart(stateMachine: StateStack<TypeRacer>): void {
		const timer = new Timer(stateMachine.game.settings.time);
		timer.start();
		timer.endListener.addListener(() => {
			this.finish(stateMachine);
		});

		stateMachine.game.namespace.emit('start-typing', {
			text: this.text,
			time: stateMachine.game.settings.time
		});

		stateMachine.game.players.forEach((player) => {
			player.gameInfo['game'] = { count: 0 };

			player.activeSocket.on('typeracer:typing', (count: number) => {
				player.gameInfo['game'].count += count;
				this.emitProgress(stateMachine, player);
			});

			player.activeSocket.on('typeracer:typing-error', (count: number) => {
				player.gameInfo['game'].count -= count;
				this.emitProgress(stateMachine, player);
			});
		});
	}

	emitProgress(stateMachine: StateStack<TypeRacer>, player: Player) {
		stateMachine.game.room.emit(
			'progress',
			player.playerInfo.username,
			player.gameInfo['game'].count
		);
	}

	onStop(stateMachine: StateStack<TypeRacer>): void {
		stateMachine.game.players.forEach((player) => {
			player.activeSocket.removeAllListeners('typeracer:typing');
			player.activeSocket.removeAllListeners('typeracer:typing-error');
		});
	}
}
