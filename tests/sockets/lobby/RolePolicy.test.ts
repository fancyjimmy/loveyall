import {beforeEach, describe, expect, it} from 'vitest';
import {ChooseOldestRolePolicy} from '../../../src-socket-io/lib/handler/lobby/policy/role';
import type {Player} from '../../../src-socket-io/lib/handler/lobby/manage/types';
import {LobbyRole} from "../../../src-socket-io/lib/handler/lobby/manage/types";
import type {Socket} from 'socket.io';

describe('ChooseOldestRolePolicy', () => {
    let chooseOldestRolePolicy: ChooseOldestRolePolicy;
    let players: Player[];
    beforeEach(() => {
        chooseOldestRolePolicy = new ChooseOldestRolePolicy();
        players = [
            {
                username: '1',
                joinedTime: new Date(2021, 1, 1),
                reconnecting: false,
                sessionKey: '1',
                role: LobbyRole.HOST,
                socket: undefined as unknown as Socket,
                extra: null
            },
            {
                username: '2',
                joinedTime: new Date(2021, 1, 3),
                reconnecting: false,
                sessionKey: '2',
                role: LobbyRole.PLAYER,
                socket: undefined as unknown as Socket,
                extra: null
            },
            {
                username: '3',
                joinedTime: new Date(2021, 1, 2),
                reconnecting: false,
                sessionKey: '3',
                role: LobbyRole.PLAYER,
                socket: undefined as unknown as Socket,
                extra: null
            }
        ];
    });
    it('nextHost works', () => {
        const player = players[0];
        const plays = [...players].filter(p => p !== player);
        const nextHost = chooseOldestRolePolicy.nextHost(plays, player);
        expect(nextHost).toBe(players[2]);
    });

    it('nextHost when leaving player is not host', () => {
        const player = players[1];
        const plays = [...players].filter(p => p !== player);
        const nextHost = chooseOldestRolePolicy.nextHost(plays, player);
        expect(nextHost).toBe(null);
    });

    it('nextHost when leaving player is not', function () {
        let player = players[0];
        let plays = [...players].filter(p => p !== player);
        let nextHost = chooseOldestRolePolicy.nextHost(plays, player);
        nextHost!.role = LobbyRole.HOST;

        expect(nextHost).toBe(players[2]);

        player = players[2];
        plays = [...plays].filter(p => p !== player);
        nextHost = chooseOldestRolePolicy.nextHost(plays, player);

        expect(nextHost).toBe(players[1]);
    });

    it('nextHost when leaving player not', function () {
        let player = players[0];
        let plays = [...players].filter(p => p !== player);
        let nextHost = chooseOldestRolePolicy.nextHost(plays, player);
        nextHost!.role = LobbyRole.HOST;

        expect(nextHost).toBe(players[2]);

        player = players[1];
        plays = [...plays].filter(p => p !== player);
        nextHost = chooseOldestRolePolicy.nextHost(plays, player);

        expect(nextHost).toBe(null);
    });

    it('nextHost when leaving player sdf', function () {
        let player = players[1];
        let plays = [...players].filter(p => p !== player);
        let nextHost = chooseOldestRolePolicy.nextHost(plays, player);

        expect(nextHost).toBe(null);

        player = players[2];
        plays = [...plays].filter(p => p !== player);
        nextHost = chooseOldestRolePolicy.nextHost(plays, player);

        console.log(plays);
        expect(nextHost).toBe(null);
    });

    it('nextHost when leaving player mit', function () {
        let player = players[1];
        let plays = [...players].filter(p => p !== player);
        let nextHost = chooseOldestRolePolicy.nextHost(plays, player);

        expect(nextHost).toBe(null);

        player = players[2];
        plays = [...plays].filter(p => p !== player);
        nextHost = chooseOldestRolePolicy.nextHost(plays, player);

        console.log(plays);
        expect(nextHost).toBe(null);


        player = players[0];
        plays = [...plays].filter(p => p !== player);
        nextHost = chooseOldestRolePolicy.nextHost(plays, player);
        expect(nextHost).toBe(null);

    });

    it('nextHost when leaving player lo', function () {
        let player = players[1];
        let plays = [...players].filter(p => p !== player);
        let nextHost = chooseOldestRolePolicy.nextHost(plays, player);

        expect(nextHost).toBe(null);

        player = players[0];
        plays = [...plays].filter(p => p !== player);
        nextHost = chooseOldestRolePolicy.nextHost(plays, player);

        console.log(plays);
        expect(nextHost).toBe(players[2]);
    });


    it('nextHost when leaving player mo', function () {
        let player = players[0];
        let plays = [...players].filter(p => p !== player);
        let nextHost = chooseOldestRolePolicy.nextHost(plays, player);

        expect(nextHost).toBe(players[2]);

        player = players[1];
        plays = [...plays].filter(p => p !== player);
        nextHost = chooseOldestRolePolicy.nextHost(plays, player);

        console.log(plays);
        expect(nextHost).toBe(null);
    });
});
