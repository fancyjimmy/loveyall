<script lang="ts">

    import {LOBBY_SESSION_KEY} from "../../../lib/constants";
    import {onMount} from "svelte";
    import {getLobbyConnection} from "../../../lib/lobby/LobbyConnection";

    export let data;

    function getSessionStorage(key: string): string | null {
        return sessionStorage.getItem(`${LOBBY_SESSION_KEY}${data.lobbyId}${key}`);
    }

    let token;
    let player;
    onMount(() => {
        token = getSessionStorage('sessionKey');
        let socket = getLobbyConnection(data.lobbyId, token);

        socket.on("playerChanged", (p) => {
            player = p;
        });

    });

</script>
<p>Hello world {token}</p>

<a href="\lobby\{data.lobbyId}\test">test</a>

<p>{JSON.stringify(player)}</p>