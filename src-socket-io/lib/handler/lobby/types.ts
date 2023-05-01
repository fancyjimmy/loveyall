import { z } from 'zod';
import type { LobbyInfo } from './manage/types';
import { ZLobbyInfo } from './manage/types';

export const createResponseSchema = <T>(dataSchema: z.ZodSchema<T>) => {
	return z
		.function()
		.args(
			z.object({
				message: z.string().optional(),
				success: z.boolean(),
				data: dataSchema.optional()
			})
		)
		.returns(z.void());
};

export enum LobbyRole {
	PLAYER = 'player',
	HOST = 'host'
}

export const ZPlayerInfo = z.object({
	username: z.string().nonempty(),
	role: z.nativeEnum(LobbyRole),
	joinedTime: z.date().default(() => new Date()),
	sessionKey: z.string().nonempty()
});

export const ZGeneralPlayerInfo = ZPlayerInfo.omit({
	sessionKey: true
});

export type GeneralPlayerInfo = z.infer<typeof ZGeneralPlayerInfo>;

export type PlayerInfo<T = unknown> = z.infer<typeof ZPlayerInfo> & {
	data?: T;
};

export type LobbyClientEvents = {
	joined: {
		lobbyInfo: LobbyInfo;
		role: LobbyRole;
		players: PlayerInfo<any>[];
	};
	playerChanged: {
		players: PlayerInfo<any>[];
	};
	error: {
		message: string;
	};
};

export type LobbyClientEventFunctions = {
	[K in keyof LobbyClientEvents]: (data: LobbyClientEvents[K]) => void;
};

export const ZJoinInfo = ZLobbyInfo.extend({
	players: z.array(ZGeneralPlayerInfo),
	role: z.nativeEnum(LobbyRole),
	username: z.string()
});
