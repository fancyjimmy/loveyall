import {
	State,
	StateStack
} from '../../../../../../../src-socket-io/lib/handler/game/statefull/StateFullGame';
import type { TypeRacer } from './TypeRacer';
import type { PlayerResult } from './types';

export default class TypeRacerFinishState extends State<TypeRacer> {
	constructor(private playerResult: PlayerResult[]) {
		super();
	}

	onStart(stateMachine: StateStack<TypeRacer>): void {
		stateMachine.game.namespace.emit('result', this.playerResult);
		stateMachine.game.players.forEach((player) => {
			player.activeSocket.once('typeracer:finish', () => {
				stateMachine.pop();
			});
		});
	}

	onStop(stateMachine: StateStack<TypeRacer>): void {
		stateMachine.game.players.forEach((player) => {
			player.activeSocket.removeAllListeners('typeracer:finish');
		});
	}
}
