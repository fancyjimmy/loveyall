<script lang="ts">
    import {onMount} from "svelte";
    import {getLobbyConnection, getSessionStorage} from "../../../lib/lobby/LobbyConnection";
    import GameBrowser from "$lib/components/lobby/GameBrowser.svelte";
    import GameLayout from "$lib/components/lobby/game/GameLayout.svelte";
    import {gameName} from "./gameStore";

    export let data;


    let token;
    let socket;

    let loaded = false;


    onMount(() => {
        token = getSessionStorage(data.lobbyId, "sessionKey");
        socket = getLobbyConnection(data.lobbyId, token);


        loaded = true;
    })

</script>
<div class="w-full h-full bg-white">
    {#if loaded}
        {#if $gameName !== null}
            <GameLayout {socket} name={$gameName}></GameLayout>
        {:else}
            <GameBrowser {socket}></GameBrowser>
        {/if}
    {:else}
        <p>connecting ... </p>
    {/if}

</div>
