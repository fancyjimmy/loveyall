<script lang="ts">
    import {io} from '../../lib/WebsocketConnection';
    import {goto} from '$app/navigation';
    import type {CreatedClientReturn, GeneralLobbyInfo} from '../../../src-socket-io/lib/handler/lobby/manage/types';
    import {onMount} from 'svelte';
    import Icon from '@iconify/svelte';

    let maxPlayers = 5;
    let isPrivate = false;
    let password: string | null = null;

    function createRoom() {
        const authenticationPolicy = {
            name: passwordAuth ? 'password' : 'none'
        };
        if (passwordAuth) {
            authenticationPolicy['password'] = password;
        }
        io.emit(
            'lobby:create',
            {
                name: lobbyName,
                maxPlayers: maxPlayers,
                isPrivate: isPrivate,
                authenticationPolicy: authenticationPolicy
            },
            (response: CreatedClientReturn) => {
                if (response.success) {
                    goto('/lobby/' + response.data.lobbyId);
                } else {
                    alert(response.message);
                }
            }
        );
    }

    let lobbies: GeneralLobbyInfo[] = [];

    function getPublicLobbies() {
        io.emit('lobby:getAll', (response) => {
            lobbies = response;
        });
    }

    onMount(() => {
        io.on('error', (error) => {
            alert(JSON.stringify(error));
        });
        getPublicLobbies();
    });
    let passwordAuth = false;
    let lobbyName = '';
</script>

<div
        class="w-screen h-screen bg-slate-900 flex"
>
    <div class="m-5">
        <form
                class="relative flex flex-col bg-slate-800 p-8 h-full rounded border-slate-700 border text-slate-300 gap-2"
        >
            <h4 class="text-3xl mb-2 font-semibold text-white w-96">New Lobby</h4>
            <label class="font-semibold text-slate-300" for="lobbyName">Lobby Name</label>

            <div class="flex">
                <input
                        bind:value={lobbyName}
                        class="font-semibold p-2 bg-slate-700 focus:ring-2 focus:ring-slate-500 flex-1 px-3 text-slate-300 focus:text-slate-100 placeholder-slate-400 focus:placeholder-slate-300 rounded duration-200 ring-1 ring-slate-600 focus:outline-0"
                        placeholder="Name"
                        id="lobbyName"
                        required
                        type="text"
                />
            </div>
            <div class="flex flex-col gap-2">
                <label class="font-semibold text-slate-300" for="maxPlayers">Max Players:</label>
                <div class="flex gap-3">
                    <div
                            class="bg-slate-600 rounded w-8 text-center font-semibold align-middle inline-block text-xl border border-slate-800 h-8"
                    >
                        {maxPlayers}
                    </div>
                    <input
                            id="maxPlayers"
                            type="range"
                            min="2"
                            max="15"
                            step="1"
                            class="flex-1"
                            bind:value={maxPlayers}
                    />
                </div>
            </div>
            <div class="flex justify-between">
                <label class="font-semibold text-slate-300" for="private">Private? </label>
                <input id="private" type="checkbox" bind:checked={isPrivate}/>
            </div>
            <div class="flex justify-between">
                <label class="font-semibold text-slate-300" for="passwordAuth">Password? </label>
                <input bind:checked={passwordAuth} id="passwordAuth" type="checkbox"/>
            </div>
            {#if passwordAuth}
                <div class="flex mt-2">
                    <input
                            class="font-semibold p-2 bg-slate-700 focus:ring-2 focus:ring-slate-500 flex-1 px-3 text-slate-300 focus:text-slate-100 placeholder-slate-400 focus:placeholder-slate-300 rounded duration-200 ring-1 ring-slate-600 focus:outline-0"
                            type="text"
                            required
                            bind:value={password}
                            placeholder="Password"
                    />
                </div>
            {/if}
            <button
                    on:click|preventDefault={createRoom}
                    class="absolute text-white bg-pink-600 p-2 rounded hover:bg-pink-500 duration-200 bottom-5 mx-0 inset-x-5"
            >Create
            </button>
        </form>

    </div>


    <div class="flex-1 h-screen flex flex-col">
        <div class="flex justify-between my-5 mr-5 items-center">
            <h2 class="text-3xl font-semibold text-white">Public Lobbies</h2>
            <button
                    class="text-pink-500 text-3xl p-2 hover:rotate-[90deg] rotate-[-90deg] duration-500 hover:scale-110 hover:text-white"
                    on:click={getPublicLobbies}
            >
                <Icon icon="oi:reload"/>
            </button>
        </div>
        <div class="flex-1 flex flex-col gap-3 mr-5 mb-5 overflow-y-auto scrollbar-hidden">
            {#each lobbies as lobby}
                <div class="p-2 bg-pink-500 text-white rounded relative hover:bg-pink-400 duration-200 hover:shadow-xl">
                    <p class="font-semibold text-xl">
                        <span>{lobby.name}</span>
                    </p>
                    <p class="text-sm mt-0 font-bold text-pink-800">
                        {lobby.playerCount} / {lobby.maxPlayers}
                    </p>

                    <a
                            href="/lobby/{lobby.lobbyId}"
                            data-sveltekit-preload-data="off"
                            class="absolute right-2 top-0 bottom-0 my-auto text-4xl flex items-center duration-200 text-white hover:scale-110"
                    >
                        <Icon icon="material-symbols:meeting-room"/>
                    </a>
                </div>
            {/each}
        </div>
    </div>
</div>
