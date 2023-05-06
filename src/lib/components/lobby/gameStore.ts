import { writable } from 'svelte/store';

export const gameName = writable<string | null>(null);

export const username = writable<string>('');

export const role = writable<'player' | 'host'>('player');
export const playerState = writable<'lobby' | 'initializing' | 'playing'>('lobby');
