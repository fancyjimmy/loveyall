import {
	State,
	StateStack
} from '../../../../../../../src-socket-io/lib/handler/game/statefull/StateFullGame';
import type { TypeRacer } from './TypeRacer';
import type Player from '../../../../../../../src-socket-io/lib/handler/lobby/playerManager/Player';
import TypingState from './TypingState';

export default class TypeRacerStartState extends State<TypeRacer> {
	private playerReadyMap: Map<string, boolean> = new Map();

	constructor() {
		super();
	}

	get playerReadiness(): { name: string; ready: boolean }[] {
		return Array.from(this.playerReadyMap.entries()).map(([name, ready]) => ({ name, ready }));
	}

	emitPlayerReady(stateMachine: StateStack<TypeRacer>, player: Player): void {
		this.playerReadyMap.set(player.playerInfo.username, true);
		stateMachine.game.room.emit('ready', player.playerInfo.username);
	}

	onEnter(stateMachine: StateStack<TypeRacer>): void {
		let count = stateMachine.game.players.length;

		stateMachine.game.players.forEach((player) => {
			this.playerReadyMap.set(player.playerInfo.username, false);
		});

		stateMachine.game.players.forEach((player) => {
			player.activeSocket.once('typeracer:start', () => {
				count--;
				this.emitPlayerReady(stateMachine, player);
				if (count === 0) {
					this.startTyping(stateMachine);
				}
			});

			player.activeSocket.on('typeracer:players', (cb: (args: any) => void) => {
				cb(this.playerReadiness);
			});
		});
	}

	onExit(stateMachine: StateStack<TypeRacer>): void {
		stateMachine.game.players.forEach((player) => {
			player.activeSocket.removeAllListeners('typeracer:ping');
			player.activeSocket.removeAllListeners('typeracer:start');
			player.activeSocket.removeAllListeners('typeracer:players');
		});
	}

	onStart(stateMachine: StateStack<TypeRacer>): void {
		stateMachine.game.joinRoom(stateMachine.game.players);

		this.onEnter(stateMachine);
		stateMachine.game.players.forEach((player) => {
			player.activeSocket.on('typeracer:ping', () => {
				stateMachine.game.namespace.emit('ping');
			});
		});
	}

	onStop(stateMachine: StateStack<TypeRacer>): void {
		this.onExit(stateMachine);
	}

	startTyping(stateMachine: StateStack<TypeRacer>) {
		stateMachine.push(new TypingState(`Hello world who is this. I am cool what is this`));
	}
}
