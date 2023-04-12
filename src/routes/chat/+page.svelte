<script>
    import {onMount} from "svelte";
    import {io} from "$lib/WebsocketConnection";
    import {goto} from "$app/navigation";
    import Icon from "@iconify/svelte";
    import {fly} from "svelte/transition";

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

    async function getCreatedRoom() {
        return new Promise((resolve, reject) => {
            io.on("roomCreated", (data) => {
                resolve(data);
            });

            io.on("roomExists", (data) => {
                resolve({...data, exists: true});
            });

            setTimeout(() => {
                reject("timeout");
            }, 5000);
        });
    }

    async function createRoom() {
        textfield = textfield.trim();
        let promiseForRoom = getCreatedRoom();
        io.emit("chatRoom:create", {name: textfield});

        try {
            let createdRoom = await promiseForRoom;
            if (createdRoom.exists) {
                alert("Room already exists");
            }

            goto(`/chat/${createdRoom.name}`, {
                invalidateAll: true
            });


        } catch (e) {
            alert("Could not create room");
            console.error(e);
            return;
        }


    }

</script>
<div class="h-screen w-screen bg-stone-200 flex flex-col font-retro p-2">

    <div class="h-8 border-outset border-stone-300 border-4 mb-2 flex justify-between items-center px-2">
        <h2 class="font-semibold text-lg">
            Chatrooms
        </h2>
        <a class="default-link" href="/general">Main Room</a>
    </div>
    <div class="flex flex-col border-4 border-stone-300 border-inset flex-1 mb-2 overflow-y-scroll custom-scrollbar">
        {#each rooms as room (room)}
            <a href="/chat/{room}"
               in:fly={{key: room, y:20, duration: 200}}
               class="p2 border-4 border-stone-300 border-outset m-1 inline-flex items-center gap-2">
                <p class="flex-1">{room}</p>
                <p class="text-xl">
                    <Icon icon="ic:round-meeting-room"/>
                </p>
            </a>
        {/each}
    </div>
    <div class="flex gap-2 h-8 w-full">
        <input type="text" bind:value={textfield}
               class="focus:outline-0 flex-1 border-4 border-stone-300 focus:border-ridge border-inset bg-white">
        <button on:click={createRoom} class="px-2 border-4 border-blue-800 border-outset focus:border-ridge text-white"
                style="background-color: blue;">Create
        </button>
    </div>
</div>

<style>
    /* Make the scrollbar outset and darker */
    .custom-scrollbar::-webkit-scrollbar {
        width: 16px;
        height: 12px;
        background-color: #e6e6e6;
    }

    /* Make the handle outset */
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #c2c2c2;
        border: 4px outset #939393;
        box-shadow: none;
    }

    /* Make the top of the handle outset */
    .custom-scrollbar::-webkit-scrollbar-thumb:start {
        border: 4px outset #939393;
    }

    /* Make the bottom of the handle outset */
    .custom-scrollbar::-webkit-scrollbar-thumb:end {
        border: 4px outset #939393;
    }

    .custom-scrollbar::-webkit-scrollbar-button:vertical:start:decrement {
        height: 18px;
        border: 4px outset #939393;
    }

    .custom-scrollbar::-webkit-scrollbar-button:vertical:end:increment {
        height: 18px;
        border: 4px outset #939393;
    }


    .custom-scrollbar::-webkit-scrollbar-track {
        background-color: #e6e6e6;
        border: 4px inset #939393;
    }


    .default-link {
        color: blue;
        text-decoration: underline;
        cursor: pointer;
    }

    .default-link:visited {
        color: #551A8B;;
    }
</style>