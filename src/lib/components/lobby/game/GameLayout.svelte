<script lang="ts">


    import {getGame} from "./GameBundle";
    import type {Socket} from "socket.io-client";

    export let name: string;
    export let socket: Socket;

    $: game = getGame(name);
</script>


{#if game !== undefined}
    <svelte:component this={game} socket={socket}/>
{:else}
    {name}
    <p>Game not Found</p>
{/if}