<script lang="ts">
    import {getGameWaitingScreen} from "./GameBundle";
    import DefaultWaitingScreen from "./DefaultWaitingScreen.svelte";
    import type {Socket} from "socket.io-client";

    let text = 'Waiting';

    export let name = "";
    export let socket: Socket;

    $: waitingScreen = getGameWaitingScreen(name) ?? DefaultWaitingScreen;
</script>


<svelte:component {name} {socket} this={waitingScreen}/>
