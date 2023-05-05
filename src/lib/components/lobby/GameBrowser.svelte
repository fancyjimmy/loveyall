<script lang="ts">
    import type {Socket} from 'socket.io';
    import {onMount} from 'svelte';
    import {role} from './gameStore.ts';
    import {type GameDescription, getAllGames} from './game/GameBundle';

    type GameOption = {
        name: string;
        description: string;
        minimumPlayers: number;
        maximumPlayers: number;
    };

    export let socket: Socket;

    function getAvailableGames(): GameOption[] {
        return [];
    }

    onMount(() => {
        socket.on('error', (any) => {
            console.log(any);
        });
    });

    function open(gameName: string) {
        socket.emit('start', gameName, (err: any) => {
            console.log(err);
        });
    }

    let games: GameDescription[] = getAllGames();
</script>

<svelte:head>
    <title>Browsing</title>
</svelte:head>

<div class="w-full h-full bg-slate-700 text-white">
    <h1 class="text-4xl font-mono font-bold">[GAMES]</h1>

    {#if $role === 'host'}
        <div class="flex gap-2 p-5">
            {#each games as game}
                <button
                        class="w-96 h-60 flex items-center justify-center relative overflow-hidden rounded shadow-xl"
                        on:click={() => {
						open(game.id);
					}}
                >
                    <img src={game.preview} alt="preview" class="hover:scale-110 duration-200"/>
                    <div class="absolute bottom-0 inset-x-0 p-2 bg-black/50 text-white text-start truncate">
                        {game.description}
                    </div>
                    <div class="absolute font-bold font-mono bg-black/70 p-1 text-2xl text-shadow pointer-events-none bordered-text"
                         data-text="{game.name}">
                        {game.name}
                    </div>
                </button>
            {/each}
        </div>
    {:else}
        <p>Wait for the Host to choose Game</p>
    {/if}
</div>

<style>
    .bordered-text {
        --text-border-width: 2px;
        --text-border-color: black;

    }
</style>
