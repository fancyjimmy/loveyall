<script lang="ts">
    import {io} from "../../lib/WebsocketConnection";
    import {goto} from "$app/navigation";
    import type {CreatedClientReturn} from "../../../src-socket-io/lib/lobby/types";


    let maxPlayers = 5;
    let isPrivate = false;
    let password: string | null = null;

    function createRoom() {
        io.emit("lobby:create", {
            settings: {
                maxPlayers: maxPlayers,
                isPrivate: isPrivate,
                password: password
            },
        }, (response: CreatedClientReturn) => {
            if (response.success) {
                goto("/lobby/" + response.data);
            } else {
                alert(response.message);
            }
        });
    }

</script>

<form class="flex flex-col">
    <div class="flex">
        <label for="maxPlayers">Max Players:</label>
        <input id="maxPlayers" type="number" on:change={(event) => {
            let value = parseInt(event.target.value);
            if (value < 2) {
                maxPlayers = 2;
            } else if (value > 15) {
                maxPlayers = 15;
            } else {
                if (isNaN(value)){
                    event.target.value = maxPlayers;
                } else {
                    maxPlayers = value;
                }
            }

        }} bind:value={maxPlayers}>
        <input type="range" min="2" max="15" step="1" bind:value={maxPlayers}/>
    </div>
    <div class="flex">
        <label for="private">Password? </label>
        <input id="private" type="checkbox" bind:checked={isPrivate}/>
    </div>
    {#if isPrivate}
        <div class="flex">
            <label for="password">Password: </label>
            <input id="password" type="text" required bind:value={password} placeholder="password"/>
        </div>
    {/if}
    <button on:click|preventDefault={createRoom}>Click</button>
</form>
