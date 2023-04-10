<script>
    import {onMount} from "svelte";
    import {io} from "$lib/WebsocketConnection";
    import {goto} from "$app/navigation";

    let rooms = [];

    onMount(() => {
        io.emit("chatRoom:get");

        io.on("rooms", (updatedRooms) => {
            rooms = updatedRooms;
        });


        return () => {
            io.emit("chatRoom:leave");
            io.off("rooms");
        }

    });
    let textfield = "";

    function createRoom() {
        textfield = textfield.trim();
        io.emit("chatRoom:create", {name: textfield});
        goto(`/chat/${textfield}`, {
            invalidateAll: true
        });
    }

</script>
<div>
    <a href="/chat/general">General</a>
    {#each rooms as room}
        <div>
            <a href="/chat/{room}">
                {room}
            </a>
        </div>
    {/each}


    <div>
        <input type="text" bind:value={textfield}>
        <button on:click={createRoom}>Create</button>
    </div>

</div>
