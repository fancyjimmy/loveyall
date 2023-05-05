<!--

<script lang="ts">
    import {dev} from "$app/environment";
    import DebugConsole from "$lib/components/debug/DebugConsole.svelte";

    let frames = [];

    function spawnNewFrame() {
        const extraPath = prompt("What url?");
        let stringCount = prompt("How many?") || "0";


        try {
            let numCount = parseInt(stringCount);
            if (!isNaN(numCount)) {
                const test = Array(numCount).fill(extraPath);
                frames = [...frames, ...test];
            }
        } catch (e) {

        }
    }
</script>

{#if dev}
    <div class="w-screen h-screen fixed">

        <div class="w-screen h-screen grid grid-cols-2 overflow-y-auto scrollbar-hidden">
            {#each frames as frame}
                <div class="h-screen">
                    <iframe src="http://localhost:5173/{frame}" class="w-full h-full"></iframe>
                </div>
            {/each}
        </div>
        <button class="absolute top-5 left-5 bg-lime-500 p-2 rounded z-[5]" on:click={spawnNewFrame}>New Frame</button>
    </div>
    <DebugConsole></DebugConsole>
{/if}
<style>
    details summary::-webkit-details-marker {
        display: none;
    }
</style>
-->