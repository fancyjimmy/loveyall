<script lang="ts">
    import type {LobbySettings} from "../../../../src-socket-io/lib/handler/lobby/types";

    export let lobbySettings: LobbySettings;
</script>

<div class="{$$props.class}">
    <p>
        Max Players: {lobbySettings.maxPlayers}
    </p>
    {#if lobbySettings.isPrivate}
        <p>
            Password:     {lobbySettings.password}
        </p>
    {/if}
</div>