import type GameInitializer from './GameInitializer';

export namespace GameInitializerFactory {
	export function getGameInitializer(name: string): GameInitializer<any, any, any> {
		return null as unknown as GameInitializer<any, any, any>;
	}
}
