<script lang="ts">
    import {io} from '../../lib/WebsocketConnection';
    import {goto} from '$app/navigation';
    import type {CreatedClientReturn, GeneralLobbyInfo} from '../../../src-socket-io/lib/handler/lobby/manage/types';
    import {onMount} from 'svelte';
    import Icon from "@iconify/svelte";

    let maxPlayers = 5;
    let isPrivate = false;
    let password: string | null = null;

    function createRoom() {
        const authenticationPolicy =
            {
                name: passwordAuth ? 'password' : 'none',
            };


        if (passwordAuth) {
            authenticationPolicy['password'] = password;
        }

        console.log(authenticationPolicy);

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
        io.on("error", (error) => {
            alert(JSON.stringify(error));
        });
        getPublicLobbies();
    });
    let passwordAuth = false;
    let lobbyName = '';
</script>

<div class="w-screen h-screen bg-slate-900 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
    <div class="grid items-center justify-center">
        <form
                class="flex flex-col bg-slate-800 p-8 w-full h-full rounded border-slate-700 border text-slate-300 h-min gap-4"
        >
            <h4 class="text-4xl text-slate-200 w-96">Create Lobby</h4>
            <div class="flex">
                <input
                        bind:value={lobbyName}
                        class="font-semibold p-2 bg-slate-200 focus:ring-2 focus:ring-slate-500 flex-1 px-3 text-slate-800 focus:text-slate-900 placeholder-slate-500 rounded duration-200 ring-1 ring-slate-700 focus:outline-0"
                        placeholder="Name"
                        required
                        type="text"
                />
            </div>
            <div class="flex flex-col gap-2">
                <label for="maxPlayers" class="text-2xl text-slate-300">Max Players:</label>
                <div class="flex gap-3">
                    <div
                            class="bg-slate-600 rounded w-8 text-center align-middle inline-block text-xl border border-slate-800 h-8"
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
                <label class="text-2xl text-slate-300" for="private">Private? </label>
                <input id="private" type="checkbox" bind:checked={isPrivate}/>
            </div>
            <div class="flex justify-between">
                <label class="text-2xl text-slate-300" for="passwordAuth">Password? </label>
                <input bind:checked={passwordAuth} id="passwordAuth" type="checkbox"/>
            </div>
            {#if passwordAuth}
                <div class="flex">
                    <input
                            class="font-semibold p-2 bg-slate-200 focus:ring-2 focus:ring-slate-500 flex-1 px-3 text-slate-800 focus:text-slate-900 placeholder-slate-500 rounded duration-200 ring-1 ring-slate-700 focus:outline-0"
                            type="text"
                            required
                            bind:value={password}
                            placeholder="Password"
                    />
                </div>
            {/if}
            <button
                    on:click|preventDefault={createRoom}
                    class="text-white bg-lime-600 p-2 rounded hover:bg-lime-500 duration-200">Create
            </button
            >
        </form>
    </div>

    <div>
        <div class="flex justify-between my-4 px-4 items-center">
            <h2 class="text-4xl font-semibold text-white">Public Lobbies</h2>
            <button class="text-lime-500 text-3xl p-2 hover:rotate-[45deg] duration-500 hover:scale-110 hover:text-white"
                    on:click={getPublicLobbies}>
                <Icon icon="oi:reload"></Icon>
            </button>
        </div>
        <div class="flex flex-col gap-3 p-3">
            {#each lobbies as lobby}
                <div class="p-3 bg-lime-400 rounded relative">
                    <p class="font-semibold">
                        Lobby <span>{lobby.lobbyId}</span>
                    </p>
                    <p>
                        {lobby.playerNumber} / {lobby.maxPlayers}
                    </p>

                    <a href="/lobby/{lobby.lobbyId}"
                       class="absolute right-2 top-0 bottom-0 my-auto text-4xl flex items-center duration-200 hover:text-lime-800 text-black hover:scale-110">
                        <Icon icon="material-symbols:meeting-room"></Icon>
                    </a>
                </div>
            {/each}
        </div>
    </div>
</div>
