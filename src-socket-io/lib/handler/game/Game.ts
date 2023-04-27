import type { GameRequirements } from './types';
import CheckedNamespaceHandler from '../../socket/CheckedNamespaceHandler';
import type { PlayerInfo } from '../lobby/types';
import type { z } from 'zod';
import type { LobbyHandler } from '../lobby/LobbyHandler';
import type { CheckedNamespaceOption, TypedNamespaceHandler } from '../../socket/types';

export default abstract class Game<
	THandler extends z.ZodObject<Record<string, any>>,
	TGameOptions,
	TGameRequirements extends GameRequirements
> extends CheckedNamespaceHandler<THandler, { player: PlayerInfo }> {
	protected constructor(
		public lobbyHandler: LobbyHandler,
		validator: THandler,
		handler: TypedNamespaceHandler<z.infer<typeof validator>>,
		options: CheckedNamespaceOption,
		public readonly requirements: TGameRequirements
	) {
		super(lobbyHandler.namespaceName, lobbyHandler.io, validator, handler, options);
	}
}
