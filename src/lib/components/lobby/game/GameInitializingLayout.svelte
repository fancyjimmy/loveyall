<script lang="ts">

    import type {Socket} from "socket.io-client";
    import {getGameInitializer} from "./GameBundle";

    export let name: string;
    export let socket: Socket;

    $: initializingScreen = getGameInitializer(name);

</script>

<svelte:component {name} {socket} this={initializingScreen}/>