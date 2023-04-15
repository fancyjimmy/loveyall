<script lang="ts">
    import {afterUpdate, beforeUpdate, onMount} from 'svelte';
    import {io} from '$lib/WebsocketConnection';

    import Icon from '@iconify/svelte';
    import {fade, fly} from 'svelte/transition';
    import {flip} from "svelte/animate";
    import {dev} from "$app/environment";

    export let room = '';
    export let user = '';

    let textfield = '';
    let name = '';
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

    function updateUsers(usr) {
        users = usr;
    }

    let ownIndex = -1;

    onMount(() => {
        if (!user) {
            user = sessionStorage.getItem('user');
            if (!user) {
                user = prompt('What is your name?');
                sessionStorage.setItem('user', user);
                name = user;
            }
        }


        setTimeout(reloadIfNotLoaded, 4000);


        io.on('message', updateMessages);
        io.on('name', updateName);
        io.on('users', updateUsers);
        io.emit(`chat:${room}:join`, {name: user});

        return () => {
            io.emit(`chat:${room}:leave`);
            io.off('message', updateMessages);
            io.off('name', updateName);
            io.off('users', updateUsers);
        };
    });

    function colorFromName(name: string) {
        const minSaturation = 50;
        const maxSaturation = 100;
        const minLightness = 30;
        const maxLightness = 60;

        const hashCode = (str: string) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        };
        const seededRandomNumberGenerator = (a) => {
            return function () {
                var t = (a += 0x6d2b79f5);
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        };

        const random = seededRandomNumberGenerator(hashCode(name));

        const hue = Math.floor(random() * 360);
        const saturation = Math.floor(random() * (maxSaturation - minSaturation) + minSaturation);
        const lightness = Math.floor(random() * (maxLightness - minLightness) + minLightness);

        return {
            h: hue,
            s: saturation,
            l: lightness
        };
    }

    function toHslString({h, s, l}) {
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    function darken({h, s, l}, amount) {
        return {
            h,
            s,
            l: l - amount
        };
    }

    function lighten({h, s, l}, amount) {
        return {
            h,
            s,
            l: l + amount
        };
    }

    let users = [];


    function sendMessage(value) {
        let message = value.trim();
        if (!message) return;


        if (dev) { // TODO delete this. only for testing
            const loremArray = `Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab consectetur dignissimos dolore ex expedita laboriosam natus, omnis quam quos reprehenderit! A amet assumenda autem commodi dicta dolorum fugiat harum impedit iure, magni minus nulla obcaecati praesentium quasi quod, sit, soluta. Et iusto minus molestias omnis repellat. Cumque eaque perferendis quisquam`.split(" ");

            const lorem = (count: number) => {
                let a = "";
                for (let i = 0; i < count; i++) {
                    a += " " + loremArray[Math.floor(Math.random() * loremArray.length)];
                }
                return a;
            }
            if (message.startsWith("lorem")) {
                let rest = message.slice("lorem".length);
                let count = parseInt(rest);
                if (isNaN(count)) count = 5;
                message = lorem(count);
            } else if (message.startsWith("spam")) {
                let a = message.slice("spam".length);
                let b = parseInt(a);
                message = lorem(Math.floor(Math.random() * 15) + 5);
                for (let i = 0; i < b; i++) {
                    setTimeout(() => {
                        sendMessage(lorem(Math.floor(Math.random() * 15) + 5));
                    }, 200 * i);
                }
            }

        }
        textfield = '';
        io.emit(`chat:${room}:message`, {message});
        messages = [
            ...messages,
            {
                user: 'You',
                message,
                time: Date.now(),
                self: true,
                id: ownIndex--
            }
        ];
    }

    let chatElement;
    let autoscroll;

    let scrollThreshold = 20;
    beforeUpdate(() => {
        autoscroll =
            chatElement &&
            chatElement.offsetHeight + chatElement.scrollTop > chatElement.scrollHeight - scrollThreshold;
    });

    afterUpdate(() => {
        if (autoscroll) chatElement.scrollTo(0, chatElement.scrollHeight);
    });
</script>

<div class="bg-slate-900 flex flex-col p-3 overflow-y-auto flex-1 {$$props.class}">
    {#if !loaded}
        <p class="text-white font-bold">Loading...</p>

        <button
                on:click={() => {
		location.reload();
	}}>Reload
        </button
        >
    {:else}
        <div class="flex flex-col w-full h-full scrollbar-hidden overflow-hidden">
            <div class="flex justify-between items-center  border-b-slate-700 pb-2">
                <h3 class="text-3xl text-slate-100 font-bold inline-flex items-center">
                    <slot name="icon">
                        <Icon icon="ic:round-meeting-room"></Icon>
                    </slot>  {room}</h3>
                <p class="rounded-full bg-sky-500 px-3 text-white grid items-center justify-center font-bold">{name}</p>
            </div>
            <div
                    class="flex flex-1 flex-col gap-2 px-6 w-full items-start pb-2 overflow-y-auto scrollbar-hidden"
                    bind:this={chatElement}
            >
                {#each messages as message (message.id)}
                    <article
                            class:own-message={message.self}
                            class:other-message={!message.self}
                            class="message"
                            in:fly={{ key: message.id, y: 20 }}
                    >
                        {#if !message.self}
                            <p
                                    class="text-sm font-bold mt-[-8px] select-none"
                                    style="color: {toHslString(colorFromName(message.user))}"
                            >
                                {message.user}
                            </p>
                        {/if}
                        <p class="{!message.self ? 'mt-[-8px]' : ''} break-all">{message.message}</p>
                        <p
                                class="absolute bottom-px right-1.5 text-xs font-semibold select-none"
                                class:own-message={message.self}
                                class:other-message={!message.self}
                        >
                            {new Date(message.time).toLocaleTimeString()}
                        </p>
                    </article>
                {/each}
            </div>

            <div class="scrollbar-hidden h-8 gap-2 flex overflow-x-auto mt-2">
                {#each users.filter((user) => user.name !== name) as user (user.name)}
                    <div
                            class="rounded-full px-3 text-white grid items-center justify-center font-bold"
                            style="background-color: {toHslString(darken(colorFromName(user.name), 20))};"
                            in:fly={{ key: user.name, x: 20 }}
                            out:fade={{ key: user.name, duration: 200 }}
                            animate:flip="{{duration: 300}}"
                    >
                        <p>{user.name}</p>
                    </div>
                {/each}
            </div>

            <div class="flex gap-3 p-2">
                <input
                        class="text-slate-100 focus:ring-2 focus:ring-slate-500 placeholder-slate-300 focus:placeholder-slate-200 flex-1 px-3 rounded bg-slate-800 duration-200 ring-1 ring-slate-700 focus:outline-0"
                        spellcheck="false"
                        placeholder="Write something..."
                        type="text"
                        bind:value={textfield}
                        on:keydown={(event) => {
					if (event.key === 'Enter') sendMessage(textfield);
				}}
                />
                <button
                        class="hover:scale-110 duration-200 p-3 text-sky-500 text-2xl grid justify-center rounded"
                        on:click={() => {sendMessage(textfield)}}
                >
                    <Icon icon="ic:round-send"/>
                </button>
            </div>


        </div>

    {/if}
</div>

<style lang="postcss">
    .message {
        @apply relative p-2 rounded-xl max-w-[85%] break-words grow-0 min-w-[6rem] pb-2.5;
    }

    article.own-message {
        @apply bg-sky-500 justify-self-end self-end;
        border-top-right-radius: 0;
    }

    article.own-message::before {
        content: '';
        position: absolute;

        top: 0;
        right: -0.8em;
        width: 0;
        height: 0;

        border-top: solid 0.9em theme('colors.sky.500');
        border-right: solid 0.9em transparent;
    }

    article.other-message::before {
        content: '';
        position: absolute;
        top: 0;
        left: -0.8em;
        width: 0;
        height: 0;

        border-top: solid 0.9em theme('colors.slate.200');
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
