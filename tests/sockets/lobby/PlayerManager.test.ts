import { describe, expect, it } from 'vitest';
import PlayerManager from '../../../src-socket-io/lib/handler/lobby/playerManager/PlayerManager';
import { sleep } from '../../util/asyncTesting';
import type { Socket } from 'socket.io';

describe('PlayerManager', () => {
	it('should work', async function () {
		const playerManager = new PlayerManager(2, 1000 * 4);

		playerManager.onPlayerAdd((player) => {
			console.log(`Added ${player.username}`);
		});

		playerManager.onPlayerRemove((player) => {
			console.log(`Removed ${player.username}`);
		});

		playerManager.onPlayerChange((players) => {
			console.log('changed');
		});

		playerManager.createPlayer({
			username: 'test',
			lobbyId: ''
		});

		await sleep(1000 * 3);
	});

	it('should work with bind 1', async function () {
		const playerManager = new PlayerManager(2, 1000 * 2.5);

		playerManager.onPlayerAdd((player) => {
			console.log(`Added ${player.username}`);
		});

		playerManager.onPlayerRemove((player) => {
			console.log(`Removed ${player.username}`);
			expect(true).toBeTruthy();
		});

		playerManager.onPlayerChange((players) => {
			console.log('changed');
		});

		const player = playerManager.createPlayer({
			username: 'test',
			lobbyId: ''
		});
		await sleep(1000);
		await sleep(1000 * 2);
	});

	it(
		'should work with bind 2',
		async function () {
			const playerManager = new PlayerManager(2, 1000 * 2.5);

			playerManager.onPlayerAdd((player) => {
				console.log(`Added ${player.username}`);
			});

			playerManager.onPlayerRemove((player) => {
				console.log(`Removed ${player.username}`);
				expect(true).toBeTruthy(); // should not be called
			});

			playerManager.onPlayerChange((players) => {
				console.log('changed');
			});

			const player = playerManager.createPlayer({
				username: 'test',
				lobbyId: ''
			});
			await sleep(1000);

			const socket = {
				id: 'test',
				handshake: {
					auth: {
						token: player.sessionKey
					}
				}
			} as unknown as Socket;
			playerManager.bindPlayerToSocket(socket);

			await sleep(1000 * 2);
			expect(playerManager.getPlayerInfo(player.sessionKey)).toBeTruthy();

			expect(playerManager.getPlayerInfos().includes(player)).toBeTruthy();
			expect(playerManager.getPlayerInfos().length).toBe(1);
			expect(socket.data.player).toBe(player);
			playerManager.unbindPlayerFromSocket(socket);
			expect(socket.data.player === player).toBeFalsy();

			await sleep(1000 * 3);
		},
		{
			timeout: 1000 * 10
		}
	);

	it('should work with 2 players ', async function () {
		const playerManager = new PlayerManager(2, 1000 * 2.5);

		const player = playerManager.createPlayer({
			username: 'test',
			lobbyId: ''
		});

		const player2 = playerManager.createPlayer({
			username: 'test',
			lobbyId: ''
		});

		expect(player.username === player2.username).toBeTruthy;

		playerManager.bindPlayerToSocket({
			id: 'test',
			handshake: {
				auth: {
					token: player.sessionKey
				}
			}
		} as unknown as Socket);
	});

	it('should work max should work ', async function () {
		const playerManager = new PlayerManager(2, 1000 * 2.5);

		const player = playerManager.createPlayer({
			username: 'test',
			lobbyId: ''
		});

		const player2 = playerManager.createPlayer({
			username: 'test',
			lobbyId: ''
		});

		try {
			const player3 = playerManager.createPlayer({
				username: 'test',
				lobbyId: ''
			});
		} catch (e) {
			if (e instanceof Error) {
				expect(e.message.includes('Max players reached')).toBeTruthy();
			}
		}

		expect(player.username === player2.username).toBeFalsy();
		expect(player2.username).toBe('test#1');
	});
});
