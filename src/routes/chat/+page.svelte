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
<div class="h-screen w-screen bg-slate-900 flex flex-col p-3">

    <div class="h-8 mb-2 flex justify-between items-center px-2">
        <h2 class="font-semibold text-4xl text-slate-300">
            Chatrooms
        </h2>
        <a class="p-1 px-3 bg-lime-400 rounded-full font-semibold" href="/general">Main</a>
    </div>
    <div class="flex flex-col flex-1 mb-2">
        {#each rooms as room (room.name)}
            <a href="/chat/{room.name}"
               in:fly={{key: room, y:20, duration: 200}}
               class="p-4 m-1 inline-flex items-center gap-2 bg-lime-600 rounded font-semibold text-white">
                <p class="flex-1">{room.name}</p>
                <p class="text-xl inline-flex items-center">
                    <span class="font-bold text-lime-700">
                    {room.userCount}
                    </span>
                    <Icon icon="ic:round-meeting-room"/>
                </p>
            </a>
        {/each}
    </div>
    <div class="flex gap-2 w-full">
        <input type="text" bind:value={textfield}
               class="text-slate-100 focus:ring-2 focus:ring-slate-500 placeholder-slate-300 focus:placeholder-slate-200 flex-1 px-3 rounded bg-slate-800 duration-200 ring-1 ring-slate-700 focus:outline-0">
        <button on:click={createRoom} class="p-3 text-white bg-lime-600 rounded-full px-5">Create
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