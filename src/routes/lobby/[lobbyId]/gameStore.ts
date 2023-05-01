import { writable } from 'svelte/store';

export const gameName = writable<string | null>(null);

export const role = writable<'player' | 'host'>('player');
