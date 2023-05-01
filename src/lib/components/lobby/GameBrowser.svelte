<script lang="ts">

    import type {Socket} from "socket.io";
    import {onMount} from "svelte";
    import {role} from "../../../routes/lobby/[lobbyId]/gameStore.ts";

    type GameOption = {
        name: string,
        description: string,
        minimumPlayers: number,
        maximumPlayers: number,
    }

    export let socket: Socket;

    function getAvailableGames(): GameOption[] {
        return [];
    }


    onMount(() => {
        socket.on("error", (any) => {
            console.log(any);
        })
    })

    function open(gameName: string) {

        socket.emit("start", gameName, (err: any) => {
            console.log(err);
        });
    }
</script>

<div>
    <p>Games</p>

    {#if $role}

    {/if}
    <button class="bg-lime-500 rounded p-2" on:click={() => {open("pixel")}}> Pixel</button>
</div>
