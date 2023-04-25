import {describe, expect, it} from "vitest";
import PlayerManager from "../../../src-socket-io/lib/handler/lobby/playerManager/PlayerManager";
import {sleep} from "../../util/asyncTesting";
import type {Socket} from "socket.io";


describe("PlayerManager", () => {

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

        playerManager.addPlayer({
            username: 'test',
            lobbyId: "",
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

        const player = playerManager.addPlayer({
            username: 'test',
            lobbyId: "",
        });
        await sleep(1000);
        await sleep(1000 * 2);

    });

    it('should work with bind 2', async function () {
        const playerManager = new PlayerManager(2, 1000 * 2.5);

        playerManager.onPlayerAdd((player) => {
            console.log(`Added ${player.username}`);
        });

        playerManager.onPlayerRemove((player) => {
            console.log(`Removed ${player.username}`);
            expect(true).toBeFalsy(); // should not be called
        });

        playerManager.onPlayerChange((players) => {
            console.log('changed');
        });

        const player = playerManager.addPlayer({
            username: 'test',
            lobbyId: "",
        });
        await sleep(1000);


        playerManager.bindPlayerFromSocket({
            id: "test",
            handshake: {
                auth: {
                    token: player.sessionKey
                }
            }
        } as unknown as Socket);
        await sleep(1000 * 2);

    });

    it('should work with 2 players ', async function () {
        const playerManager = new PlayerManager(2, 1000 * 2.5);

        const player = playerManager.addPlayer({
            username: 'test',
            lobbyId: "",
        });

        const player2 = playerManager.addPlayer({
            username: 'test',
            lobbyId: "",
        });

        expect(player.username === player2.username).toBeTruthy;


        playerManager.bindPlayerFromSocket({
            id: "test",
            handshake: {
                auth: {
                    token: player.sessionKey
                }
            }
        } as unknown as Socket);

    });


    it('should work max should work ', async function () {
        const playerManager = new PlayerManager(2, 1000 * 2.5);

        const player = playerManager.addPlayer({
            username: 'test',
            lobbyId: "",
        });

        const player2 = playerManager.addPlayer({
            username: 'test',
            lobbyId: "",
        });

        try {

            const player3 = playerManager.addPlayer({
                username: 'test',
                lobbyId: "",
            });
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message.includes("Max players reached")).toBeTruthy();
            }
        }


        playerManager.bindPlayerFromSocket({
            id: "test",
            handshake: {
                auth: {
                    token: player.sessionKey
                }
            }
        } as unknown as Socket);

    });

});