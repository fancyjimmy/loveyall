import type Game from '../Game';
import type Player from '../../lobby/playerManager/Player';
import { Listener } from '../../../utilities/Listener';

export abstract class State<TGame extends Game> {
	/**
	 * when this state is pushed onto the stack for the first time, the onStart method will be called
	 * @param stateMachine
	 */
	abstract onStart(stateMachine: StateStack<TGame>): void;

	/**
	 * logic for removing the listeners for one Player
	 * @param stateMachine
	 * @param player
	 */
	stop(stateMachine: StateStack<TGame>, player: Player): void {}

	/**
	 * logic for adding the listeners for one Player
	 * @param stateMachine
	 * @param player
	 */
	start(stateMachine: StateStack<TGame>, player: Player): void {}

	/**
	 * when this state is popped off the stack, the onExit method will be called for this
	 * @param stateMachine
	 */
	abstract onStop(stateMachine: StateStack<TGame>): void;

	/**
	 * when the state above is popped off the stack, this state will be the current state
	 * and the onEnter method will be called
	 * @param stateMachine
	 */
	onEnter(stateMachine: StateStack<TGame>): void {
		stateMachine.pop();
	}

	/**
	 * when a new state is pushed onto the stack, the stop method will be called for the current state
	 * @param stateMachine
	 */
	onExit(stateMachine: StateStack<TGame>): void {}
}

export class StateStack<TGame extends Game> {
	private stateStack: State<TGame>[] = [];
	private players: Player[] = [];

	constructor(players: Player[], public readonly game: TGame) {
		this.players = players;
	}

	get currentState() {
		return this.stateStack[this.stateStack.length - 1];
	}

	public push(state: State<TGame>) {
		if (this.currentState) {
			this.currentState.onExit(this);
		}
		this.stateStack.push(state);
		state.onStart(this);
	}

	public pop(): State<TGame> | undefined {
		const popped = this.stateStack.pop();
		if (popped) {
			popped.onStop(this);
			this.currentState.onEnter(this);
		}
		return popped;
	}
}

export abstract class StateFullGame<TGame extends Game> implements Game {
	private readonly stateStack: StateStack<TGame>;

	#players: Player[] = [];

	private startState: State<TGame>;
	private endListener = new Listener();

	protected constructor(players: Player[], startState: State<TGame>) {
		// TODO check if this can be refactored better
		this.stateStack = new StateStack<TGame>(players, this as any);
		this.startState = startState;
		this.#players = players;
	}

	get players(): Player[] {
		return this.#players;
	}

	onEnd(callback: () => void): void {
		this.endListener.addListener(callback);
	}

	start(): void {
		this.stateStack.push(this.startState);
	}

	protected end() {
		this.endListener.call();
	}
}
