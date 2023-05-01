<script lang="ts">

    import type {Socket} from "socket.io";
    import {SvelteComponent} from "svelte";
    import SharedPixelCanvas from "./pixel/SharedPixelCanvas.svelte";

    export let socket: Socket;
    export let name: string | null;

    console.log(name);

    const gameMap = new Map<string, SvelteComponent>();

    gameMap.set("pixel", SharedPixelCanvas);


    $: game = gameMap.get(name ?? "");
</script>


{#if game !== undefined}
    <svelte:component this={game} socket={socket}/>
{:else}
    {name}
    <p>Game not Found</p>
{/if}