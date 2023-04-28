<script lang="ts">

    import {LOBBY_SESSION_KEY} from "../../../lib/constants";
    import {onMount} from "svelte";
    import {getLobbyConnection} from "../../../lib/lobby/LobbyConnection";
    import {goto} from "$app/navigation";
    import type {Response} from '../../../../src-socket-io/lib/handler/lobby/manage/types';


    export let data;

    function getSessionStorage(key: string): string | null {
        return sessionStorage.getItem(`${LOBBY_SESSION_KEY}${data.lobbyId}${key}`);
    }

    let token;

    let socket;
    let player;

    onMount(() => {
        token = getSessionStorage('sessionKey');
        socket = getLobbyConnection(data.lobbyId, token);

        socket.on("game-chosen", (game: any) => {
            goto(`/lobby/${data.lobbyId}/${game.url}`);
        });
    });

    function open(game) {
        socket.emit("start", game, (response: Response<void>) => {
            if (response.success) {
                goto(`/lobby/${data.lobbyId}/${game}`);
            }
        });
    }
</script>

<div class="bg-white w-full h-full flex flex-col">
    <p>Main</p>
    <button on:click={() => {open("pixel")}}>Pixel</button>

    <div class="flex-1 flex items-center justify-center">
    </div>
</div>
