import type {Server} from 'socket.io';
import {type GeneralLobbyInfo, ZGeneralLobbyInfo, ZLobbyCreationSettings, ZLobbyJoinOption} from './types';
import {z} from 'zod';
import {createResponseSchema} from '../types';
import LobbyHandler from '../LobbyHandler';
import CheckedServerHandler from '../../../socket/CheckedServerHandler';

/*
Lobby Making Description

user sends a create request to the LobbyManagerHandler
LobbyManagerHandler creates a new LobbyHandler with a random generated ID
LobbyManager sends the ID back to the user

User will be redirected to the /lobby/[lobbyId] page
he can then join with a name and password
he can send a link with the lobbyId to his friends

any person can join the lobby with the lobbyId and the password
the person then can ask the LobbyManagerHandler to join the lobby
if they can join, they will get a sessionKey to authenticate themselves with it for the lobby


 */
export const ZLobbyManagingEvents = z.object({
	create: z.tuple([ZLobbyCreationSettings, createResponseSchema(ZGeneralLobbyInfo)]),
	join: z.tuple([ZLobbyJoinOption, createResponseSchema(z.string().nonempty())]),
	get: z.tuple([
		z.object({
			lobbyId: z.string()
		}),
		createResponseSchema(ZGeneralLobbyInfo)
	]),
	getAll: z.function().args(z.array(ZGeneralLobbyInfo)).returns(z.void())
});
export default class LobbyManagerHandler extends CheckedServerHandler<
	typeof ZLobbyManagingEvents,
	any
> {
	private lobbyMap: Map<string, LobbyHandler> = new Map();

	constructor(io: Server) {
		super(
			'lobby',
			io,
			ZLobbyManagingEvents,
			{
				create: ([settings, cb]) => {
					const id = this.createLobbyId();

					const lobby = new LobbyHandler(this.io, id, settings);
					this.lobbyMap.set(id, lobby);
					lobby.start();
					lobby.onEnd(() => {
						this.lobbyMap.delete(id);
					});

					cb({
						data: lobby.generalInfo,
						success: true,
						message: 'Lobby created'
					});
				},
				join: ([joinOptions, cb]) => {
					const lobbyId = joinOptions.lobbyId;
					const lobby = this.lobbyMap.get(lobbyId);
					if (!lobby) {
                        cb({ message: 'LOBBY NOT FOUND', success: false });
						return;
					}

					const joined = lobby.join(joinOptions);

					if (!joined) {
						cb({ message: 'Could not join', success: false });
						return;
					} else {
						cb({ success: true, data: joined.sessionKey });
						return;
					}
				},
				get: ([{ lobbyId }, callback]) => {
					const lobby = this.lobbyMap.get(lobbyId);
					if (!lobby) {
						callback({ message: 'Lobby not found', success: false });
						return;
					} else {
						callback({ message: '', success: true, data: lobby.generalInfo });
					}
				},
				getAll: (callback) => {
					callback(this.getAllPublicLobbies());
				}
			},
			{
				onClientError: (error, socket) => {
					console.error(error);
					socket.emit('error', { message: error.message });
				}
			}
		);
	}

	getAllLobbies(): GeneralLobbyInfo[] {
		return Array.from(this.lobbyMap.values()).map((lobby) => lobby.generalInfo);
	}

	getAllPublicLobbies(): GeneralLobbyInfo[] {
		return this.getAllLobbies().filter((lobby) => !lobby.isPrivate);
	}

	private createLobbyId(): string {
		return crypto.randomUUID();
	}
}
