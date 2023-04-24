<script lang="ts">
    import type {LobbySettings} from "../../../../src-socket-io/lib/handler/lobby/manage/types";

    export let lobbySettings: LobbySettings;
</script>

<div class="{$$props.class}">
    <p>
        Max Players: {lobbySettings.maxPlayers}
    </p>

    <p>
        Private:    {lobbySettings.isPrivate ? "Yes" : "No"}
    </p>
    {#if lobbySettings.authenticationPolicy.name === "password"}
        <p>
            Password:     {lobbySettings.authenticationPolicy.password}
        </p>
    {/if}
</div>