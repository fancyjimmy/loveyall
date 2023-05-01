<script lang="ts">
    import Icon from '@iconify/svelte';
    import type {JoinInfo} from '../../../../../src-socket-io/lib/handler/lobby/LobbyHandler';
    import {dev} from '$app/environment';

    let link = window.location.href;
    let copied = false;

    function copyLink() {
        if (copied) return;
        navigator.clipboard.writeText(link);
        copied = true;
        setTimeout(() => {
            copied = false;
        }, 1000);
    }

    export let self = {
        username: '',
        role: 'player'
    };
    export let joinInfo: JoinInfo;
</script>

<div class="text-lg">
    <p class="text-slate-400 text-xs font-bold">LOBBY - {joinInfo.name}</p>
    <div class="ml-1 text-sm font-bold text-slate-300">
        <p class="">MAX PLAYERS: <span class="text-pink-500">{joinInfo.maxPlayers}</span></p>
        <p class="">
            VISIBILITY: <span class="text-pink-500">{joinInfo.isPrivate ? 'private' : 'public'}</span>
        </p>
        {#if joinInfo.authenticationPolicy.name === 'password'}
            <p class="">
                PASSWORD: <span
                    class="text-transparent bg-pink-500">{joinInfo.authenticationPolicy.password ?? ''}</span>
            </p>
        {/if}
    </div>

    <div class="flex items-center text-xl absolute top-2 right-2">
        {#if self.role === "host"}

        {/if}
        {#if dev}
            <!-- TODO Remove when prod -->
            <a class="p-1 hover:bg-slate text-lime-600 duration-200" href={link} target="_blank">
                <Icon icon="material-symbols:add"/>
            </a>
        {/if}

        <button
                class="p-1 {copied ? 'text-sky-500' : 'text-slate-400  hover:text-white'} duration-200"
                on:click={copyLink}
        >
            <Icon icon="material-symbols:content-copy"/>
        </button>
    </div>
</div>
