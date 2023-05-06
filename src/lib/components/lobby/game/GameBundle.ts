import type { SvelteComponent } from 'svelte';
import PixelCanvas from './pixel/PixelCanvas.svelte';
import PixelCanvasInit from './pixel/PixelCanvasInit.svelte';
import Typewriter from './typewriter/Typewriter.svelte';
import TypewriterInit from './typewriter/TypewriterInit.svelte';

export type GameDescription = {
	id: string;
	name: string;
	description: string;
	icon: string;
	preview: string;
};

export type Component = typeof SvelteComponent;

export class GameBundle {
	public readonly waitingScreen: Component | null;
	public readonly gameScreen: Component;
	public readonly initializingScreen: Component;

	constructor(
		waitingScreen: Component | null,
		gameScreen: Component,
		initializingScreen: Component,
		public readonly settings: GameDescription
	) {
		this.waitingScreen = waitingScreen;
		this.gameScreen = gameScreen;
		this.initializingScreen = initializingScreen;
	}
}

export const gameBundles: GameBundle[] = [];

gameBundles.push(
	new GameBundle(null, PixelCanvas, PixelCanvasInit, {
		id: 'pixel',
		name: 'Pixel',
		description: 'Draw pixelart together with your friends!',
		icon: 'pixel.svg',
		preview: '/games/pixel.png'
	})
);

gameBundles.push(
	new GameBundle(null, Typewriter, TypewriterInit, {
		id: 'typewriter',
		name: 'Typewriter',
		description: 'Write a story together with your friends!',
		icon: 'typewriter.svg',
		preview: '/games/typewriter.png'
	})
);

export function getGame(name: string): Component | null {
	return gameBundles.find((bundle) => bundle.settings.id === name)?.gameScreen ?? null;
}

export function getGameInitializer(name: string): Component | null {
	return gameBundles.find((bundle) => bundle.settings.id === name)?.initializingScreen ?? null;
}

export function getGameWaitingScreen(name: string): Component | null {
	return gameBundles.find((bundle) => bundle.settings.id === name)?.waitingScreen ?? null;
}

export function getAllGames(): GameDescription[] {
	return Array.from(gameBundles.values()).map((bundle) => bundle.settings);
}
