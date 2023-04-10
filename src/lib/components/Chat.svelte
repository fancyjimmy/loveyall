<script lang="ts">
    import {onMount} from "svelte";
    import {io} from "$lib/WebsocketConnection";

    import Icon from '@iconify/svelte';

    export let room = "";
    export let user = "";

    let textfield = '';
    let name = "";
    let messages = [];
    let loaded = false;

    function updateName(n) {
        name = n;
        loaded = true;
    }

    function updateMessages(msg) {
        messages = [...messages, msg];
    }

    function reloadIfNotLoaded() {
        if (!loaded) {
            location.reload();
        }
    }

    onMount(() => {
        user = sessionStorage.getItem("user");
        if (!user) {
            user = prompt("What is your name?");
            sessionStorage.setItem("user", user);
            name = user;
        }

        //setTimeout(reloadIfNotLoaded, 5000);

        io.emit(`chat:${room}:join`, {name: user});
        io.on("message", updateMessages);
        io.on("name", updateName);

        return () => {
            io.emit(`chat:${room}:leave`);
            io.off("message", updateMessages);
            io.off("name", updateName);
        }
    });

    function colorFromName(name: string) {
        const minSaturation = 50;
        const maxSaturation = 100;
        const minLightness = 40;
        const maxLightness = 70;


        const hashCode = (str: string) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        }
        const seededRandomNumberGenerator = (a) => {
            return function () {
                var t = a += 0x6D2B79F5;
                t = Math.imul(t ^ t >>> 15, t | 1);
                t ^= t + Math.imul(t ^ t >>> 7, t | 61);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            }
        }


        const random = seededRandomNumberGenerator(hashCode(name));

        const hue = Math.floor(random() * 360);
        const saturation = Math.floor(random() * (maxSaturation - minSaturation) + minSaturation);
        const lightness = Math.floor(random() * (maxLightness - minLightness) + minLightness);

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function sendMessage() {
        const message = textfield.trim();
        if (!message) return;

        textfield = '';
        io.emit(`chat:${room}:message`, {message});
        messages = [...messages, {user: "You", message, time: Date.now(), self: true}];
    }
</script>

<div class="w-full h-full bg-slate-900 flex flex-col p-3">
    <div class="text-slate-200 font-semibold text-xl">
        <h3>Room: {room}</h3>
        <h3>Username: {name}</h3>
    </div>
    <div class="flex-1 py-5">
        <h4 class="text-3xl font-semibold text-slate-500 mb-5">Chat</h4>
        <div class="overflow-y-auto flex flex-col gap-2 px-6 w-full items-start">
            {#each messages as message}
                <article class:own-message={message.self}
                         class:other-message={!message.self} class="message">
                    {#if !message.self}
                        <p class="text-sm font-bold mt-[-8px] select-none"
                           style="color: {colorFromName(message.user)}">{message.user}</p>
                    {/if}
                    <p class="{!message.self ? 'mt-[-8px]' : ''}">{message.message}</p>
                    <p class="absolute bottom-px right-1.5 text-xs font-semibold select-none"
                       class:own-message={message.self}
                       class:other-message={!message.self}>{new Date(message.time).toLocaleTimeString()}</p>
                </article>
            {/each}
        </div>
    </div>
    <div class="flex gap-3">
        <input class="text-slate-300 flex-1 px-3 rounded bg-slate-800 duration-200 border border-slate-700 focus:outline-0"
               spellcheck="false" placeholder="Write something..." type="text" bind:value={textfield} on:keydown={(event) => {
                   if (event.key === "Enter") sendMessage();
               }}>
        <button class="hover:scale-110 duration-200 p-3 text-sky-500 text-2xl grid justify-center rounded"
                on:click={sendMessage}>
            <Icon icon="ic:round-send"></Icon>
        </button>
    </div>
</div>

<button on:click={()=> {location.reload()}}>Reload</button>

<style lang="postcss">
    .message {
        @apply relative p-2 rounded-xl max-w-[85%] break-words grow-0 min-w-[6rem] pb-2.5;
    }

    article.own-message {
        @apply bg-sky-500 justify-self-end self-end;
        border-top-right-radius: 0;
    }

    article.own-message::before {
        content: "";
        position: absolute;

        top: 0;
        right: -0.8em;
        width: 0;
        height: 0;

        border-top: solid 0.9em theme("colors.sky.500");
        border-right: solid 0.9em transparent;
    }

    article.other-message::before {
        content: "";
        position: absolute;
        top: 0;
        left: -0.8em;
        width: 0;
        height: 0;

        border-top: solid 0.9em theme("colors.slate.200");
        border-left: solid 0.9em transparent;
    }

    article.other-message {
        @apply bg-slate-200;
        border-top-left-radius: 0;
    }

    p.own-message {
        @apply text-sky-800;
    }

    p.other-message {
        @apply text-slate-700;
    }
</style>