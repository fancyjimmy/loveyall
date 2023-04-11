<script lang="ts">
    import {afterUpdate, beforeUpdate, onMount} from 'svelte';
    import {io} from '$lib/WebsocketConnection';

    import Icon from '@iconify/svelte';
    import {fade, fly} from 'svelte/transition';
    import {flip} from "svelte/animate";

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

    onMount(() => {
        user = sessionStorage.getItem('user');
        if (!user) {
            user = prompt('What is your name?');
            sessionStorage.setItem('user', user);
            name = user;
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

    function sendMessage() {
        const message = textfield.trim();
        if (!message) return;

        textfield = '';
        io.emit(`chat:${room}:message`, {message});
        messages = [
            ...messages,
            {
                user: 'You',
                message,
                time: Date.now(),
                self: true,
                id: (messages[messages.length - 1]?.id ?? -1) + 1
            }
        ];
    }

    let chatElement;
    let autoscroll;

    beforeUpdate(() => {
        autoscroll =
            chatElement &&
            chatElement.offsetHeight + chatElement.scrollTop > chatElement.scrollHeight - 20;
    });

    afterUpdate(() => {
        if (autoscroll) chatElement.scrollTo(0, chatElement.scrollHeight);
    });
</script>

<div class="w-full h-full bg-yellow-900 flex flex-col p-3">
    {#if !loaded}
        <p class="text-white font-bold">Loading...</p>
    {:else}
        <div class="text-yellow-200 font-semibold text-xl">
            <h3>Room: {room}</h3>
            <h3>Username: {name}</h3>
            <h3>ID: {io.id}</h3>
        </div>
        <div class="flex-1 pt-5 pb-3">
            <h4 class="text-3xl font-semibold text-yellow-500 mb-5">Chat</h4>
            <div class="h-full overflow-y-auto">
                <div
                        class="overflow-y-visible flex flex-col gap-2 px-6 w-full items-start pb-2"
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
                            <p class={!message.self ? 'mt-[-8px]' : ''}>{message.message}</p>
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
                <div class="scrollbar-hidden h-8 gap-2 flex overflow-x-auto">
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
            </div>
        </div>
        <div class="flex gap-3">
            <input
                    class="text-yellow-100 focus:ring-2 focus:ring-yellow-500 placeholder-yellow-300 focus:placeholder-yellow-200 flex-1 px-3 rounded bg-yellow-800 duration-200 ring-1 ring-yellow-700 focus:outline-0"
                    spellcheck="false"
                    placeholder="Write something..."
                    type="text"
                    bind:value={textfield}
                    on:keydown={(event) => {
					if (event.key === 'Enter') sendMessage();
				}}
            />
            <button
                    class="hover:scale-110 duration-200 p-3 text-sky-500 text-2xl grid justify-center rounded"
                    on:click={sendMessage}
            >
                <Icon icon="ic:round-send"/>
            </button>
        </div>
    {/if}
</div>

<button
        on:click={() => {
		location.reload();
	}}>Reload
</button
>

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

        border-top: solid 0.9em theme('colors.yellow.200');
        border-left: solid 0.9em transparent;
    }

    article.other-message {
        @apply bg-yellow-200;
        border-top-left-radius: 0;
    }

    p.own-message {
        @apply text-sky-800;
    }

    p.other-message {
        @apply text-yellow-700;
    }
</style>
