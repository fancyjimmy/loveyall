<script lang="ts">
    import {setSessionStorage} from "$lib/lobby/LobbyConnection";
    import {getSessionStorage} from "../../../lobby/LobbyConnection";

    export let error;
    export let lobbyId;

    console.log(error);

    function reset() {
        console.log(getSessionStorage(lobbyId, "sessionKey"))
        setSessionStorage(lobbyId, "sessionKey", null);
        console.log(getSessionStorage(lobbyId, "sessionKey"))
        location.reload();
    }
</script>

<div class="w-full h-full flex items-center justify-center bg-slate-900">
    <div class="bg-red-500 border-2 border-red-800 p-4 rounded text-white">
        <p class="text-white">Error</p>
        <p class="font-semibold text-3xl mb-3">{error.message}</p>
        <p class="text"><a href="/lobby">Look for another Lobby 👀</a></p>
        <button on:click={reset}>Reset</button>
    </div>
</div>