<script lang="ts">
    import SharedPixelCanvas from "$lib/components/canvas/SharedPixelCanvas.svelte";
    import {onMount} from "svelte";
    import {getLobbyConnection} from "../../../../lib/lobby/LobbyConnection";
    import {LOBBY_SESSION_KEY} from "../../../../lib/constants";

    export let data;

    function getSessionStorage(key: string): string | null {
        return sessionStorage.getItem(`${LOBBY_SESSION_KEY}${data.lobbyId}${key}`);
    }

    let token;

    let socket;
    let loaded = false;

    onMount(() => {
        token = getSessionStorage("sessionKey");
        socket = getLobbyConnection(data.lobbyId, token);
        loaded = socket.connected;
    });
</script>

<div class="bg-sky-200 w-full h-full flex flex-col">
    <p>Hello</p>
    <a href="/lobby/{data.lobbyId}">Go Back</a>

    <div class="flex-1 flex items-center justify-center">
        {#if !loaded}
            <p>Loading...</p>
        {:else}
            <SharedPixelCanvas {socket}/>
        {/if}
    </div>
</div>
