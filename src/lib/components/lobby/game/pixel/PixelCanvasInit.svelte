<script lang="ts">
    import type {Socket} from "socket.io-client";
    import {role} from "$lib/components/lobby/gameStore.js";

    export let socket: Socket;
    export let name: string;
    let width = 30;
    let height = 30;

    function createCanvas(width: number, height: number) {
        socket.emit("createCanvas", {width, height});
    }


</script>

{#if $role === "host"}
    <div>
        <p>Choose Size</p>
        <p>Width</p>

        <input type="range" min="20" max="80" bind:value={width}>
        <p>Height</p>
        <input type="range" min="20" max="80" bind:value={height}>

        <button class="bg-pink-600 " on:click={() => {createCanvas(width, height)}}>
            Create
        </button>
    </div>

{:else}
    <p>Wait for the host to choose a canvas size...</p>
{/if}

