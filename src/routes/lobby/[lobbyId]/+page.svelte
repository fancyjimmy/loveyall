<script lang="ts">
    import {onMount} from "svelte";
    import {getLobbyConnection, getSessionStorage} from "../../../lib/lobby/LobbyConnection";
    import GameBrowser from "$lib/components/lobby/GameBrowser.svelte";
    import GameLayout from "$lib/components/lobby/game/GameLayout.svelte";
    import {gameName} from "../../../lib/components/lobby/gameStore";
    import {playerState} from "../../../lib/components/lobby/gameStore.js";
    import GameInitializingLayout from "$lib/components/lobby/game/GameInitializingLayout.svelte";
    import GameWaitLayout from "$lib/components/lobby/game/GameWaitLayout.svelte";

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
            {#if $playerState === "playing"}
                <GameLayout {socket} name={$gameName}></GameLayout>
            {:else if $playerState === "initializing"}
                <GameInitializingLayout {socket} name={$gameName}></GameInitializingLayout>
            {:else}
                <GameWaitLayout {socket} name={$gameName}></GameWaitLayout>
            {/if}
        {:else}
            <GameBrowser {socket}></GameBrowser>
        {/if}
    {:else}
        <p>connecting ... </p>
    {/if}

</div>
