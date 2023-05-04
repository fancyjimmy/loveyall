import { writable } from 'svelte/store';
import type { PlayerState } from '../../../../src-socket-io/lib/handler/lobby/playerManager/Player';

export const gameName = writable<string | null>(null);

export const role = writable<'player' | 'host'>('player');
export const playerState = writable<PlayerState>('lobby');
