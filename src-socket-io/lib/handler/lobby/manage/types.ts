import { z } from 'zod';

export enum AuthenticationPolicyType {
	NONE = 'none',
	PASSWORD = 'password'
}

export const ZAuthenticationPolicy = z.discriminatedUnion('name', [
	z.object({ name: z.literal(AuthenticationPolicyType.NONE) }),
	z.object({
		name: z.literal(AuthenticationPolicyType.PASSWORD),
		password: z.string().nonempty({ message: 'Password must be set' })
	})
]);

export const ZLobbySettings = z.object({
	name: z.string().nonempty({ message: 'Name must be set' }),
	maxPlayers: z.number().min(2, { message: 'Max Players has to be above 2' }).default(5),
	chatRoomId: z.string().optional(),
	isPrivate: z.boolean().default(false),
	authenticationPolicy: ZAuthenticationPolicy.default({ name: AuthenticationPolicyType.NONE })
});

export const ZLobbyCreationSettings = ZLobbySettings.omit({ chatRoomId: true });
export const ZGeneralLobbyInfo = ZLobbySettings.omit({
	chatRoomId: true,
	authenticationPolicy: true
}).extend({
	playerCount: z.number().min(0),
	authenticationPolicyType: z.nativeEnum(AuthenticationPolicyType),
	lobbyId: z.string().nonempty({ message: 'Lobby Id must be set' })
});

export const ZLobbyInfo = ZLobbySettings.extend({
	lobbyId: z.string().nonempty({ message: 'Lobby Id must be set' })
});

export type LobbyInfo = z.infer<typeof ZLobbyInfo>;

export type LobbyCreationSettings = z.infer<typeof ZLobbyCreationSettings>;
export type LobbySettings = z.infer<typeof ZLobbySettings>;

/*
{
    name: string;
    maxPlayers: number;
    isPrivate: boolean;
    authenticationPolicyType: "password" | "none";
    lobbyId: string;
}
 */
export type GeneralLobbyInfo = z.infer<typeof ZGeneralLobbyInfo>;

export const ZLobbyJoinOption = z.object({
	lobbyId: z.string(),
	username: z.string(),
	password: z.string().nullable().optional()
});

export type LobbyJoinOption = z.infer<typeof ZLobbyJoinOption>;

export type CreatedClientReturn = Response<GeneralLobbyInfo>;

export type PlayerAuthenticationResponse = {
	username: string;
	sessionKey: string;
};

export type Response<T> = {
	message?: string;
	success: boolean;
	data?: T;
};
