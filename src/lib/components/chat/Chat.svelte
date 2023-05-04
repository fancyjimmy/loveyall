<script lang="ts">
    import {afterUpdate, beforeUpdate, onMount} from 'svelte';

    import Icon from '@iconify/svelte';
    import {dev} from '$app/environment';
    import ioClient, {Socket} from 'socket.io-client';
    import type {Message, MessageFormatter} from './ChatFormatter';
    import DefaultChatMessage from '$lib/components/chat/DefaultChatMessage.svelte';
    import ChatUsers from './ChatUsers.svelte';
    import EmojiBrowser from '$lib/components/chat/emoji/EmojiBrowser.svelte';
    import EmojiSuggestion from '$lib/components/chat/emoji/EmojiSuggestion.svelte';
    import GifBrowser from '$lib/components/chat/gif/GifBrowser.svelte';

    export let room = '';
    export let user = '';

    export let messageFormatter: MessageFormatter = (_) => null;
    export let userComponent = ChatUsers;

    let textfield = '';
    let name = '';
    let messages: Message[] = [];
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

    let io: Socket;
    onMount(() => {
        if (!user) {
            user = sessionStorage.getItem('user');
            if (!user) {
                user = prompt('What is your name?');
                sessionStorage.setItem('user', user);
                name = user;
            }
        }

        io = ioClient(`/chat/${room}`);

        //setTimeout(reloadIfNotLoaded, 4000);

        io.on('message', updateMessages);
        io.on('name', updateName);
        io.on('users', updateUsers);
        io.emit(`join`, {name: user});

        return () => {
            io.emit(`leave`);
            io.disconnect();
            io.off('message', updateMessages);
            io.off('name', updateName);
            io.off('users', updateUsers);
        };
    });

    let users = [];

    function sendMessage(value) {
        let message = value.trim();
        if (!message) return;

        if (dev) {
            // TODO delete this. only for testing
            const loremArray =
                `Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab consectetur dignissimos dolore ex expedita laboriosam natus, omnis quam quos reprehenderit! A amet assumenda autem commodi dicta dolorum fugiat harum impedit iure, magni minus nulla obcaecati praesentium quasi quod, sit, soluta. Et iusto minus molestias omnis repellat. Cumque eaque perferendis quisquam`.split(
                    ' '
                );

            const lorem = (count: number) => {
                let a = '';
                for (let i = 0; i < count; i++) {
                    a += ' ' + loremArray[Math.floor(Math.random() * loremArray.length)];
                }
                return a;
            };
            if (message.startsWith('/lorem')) {
                let rest = message.slice('/lorem'.length);
                let count = parseInt(rest);
                if (isNaN(count)) count = 5;
                message = lorem(count);
            } else if (message.startsWith('/spam')) {
                let a = message.slice('/spam'.length);
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
        io.emit(`message`, {message});
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
    let emojiBrowser = false;

    function addToInput(value: string, pos: number = value.length) {
        textfield = textfield.substring(0, pos) + value + textfield.substring(pos + value.length - 2);
    }

    function removeFromInput(pos: number, count: number) {
        textfield = textfield.substring(0, pos) + textfield.substring(pos + count + 1);
    }

    function toggleEmoji() {
        gifBrowser = false;
        emojiBrowser = !emojiBrowser;
    }

    let gifBrowser = false;

    let startOfSearch = 0;

    let startEmojiSearch = false;
    let charsSinceLastEmojiSearch = 0;

    function isSearchingEmote(text: string) {
        const parts = text.split(' ');
        const lastPart = ' ' + parts[parts.length - 1];
        return / :[a-zA-Z_]+/.test(lastPart);
    }

    let showEmojiSuggestion = false;
    let emojiSearchString = '';
    let currentCursorPosition = 0;
    let textinput;
    let justInsertedEmoji;

    function toggleGif() {
        gifBrowser = !gifBrowser;
        showEmojiSuggestion = false;
    }
</script>

<div class="bg-slate-900 flex flex-col p-3 overflow-y-auto flex-1 {$$props.class}">
    {#if !loaded}
        <p class="text-white font-bold">Loading...</p>

        <button
                on:click={() => {
				location.reload();
			}}
        >Reload
        </button>
    {:else}
        <div class="flex flex-col w-full h-full scrollbar-hidden overflow-hidden">
            <div class="flex justify-between items-center border-b-slate-700 pb-2">
                <h3 class="text-3xl text-slate-100 font-bold inline-flex items-center">
                    <slot name="icon">
                        <Icon icon="ic:round-meeting-room"/>
                        {room}
                        <p
                                class="rounded-full bg-sky-500 px-3 text-white grid items-center justify-center font-bold"
                        >
                            {name}
                        </p>
                    </slot>
                </h3>

            </div>
            <div
                    class="flex flex-1 flex-col gap-2 px-6 w-full items-start pb-2 overflow-y-auto scrollbar-hidden"
                    bind:this={chatElement}
            >
                {#each messages as message (message.id)}
                    <svelte:component this={messageFormatter(message) ?? DefaultChatMessage} {message}/>
                {/each}
            </div>

            {#if userComponent}
                <svelte:component this={userComponent} {users} self={{ name }}/>
            {/if}

            <EmojiBrowser
                    on:selected={(event) => {
					addToInput(event.detail.char);
				}}
                    on:blurred={() => {
					emojiBrowser = false;
				}}
                    class="{emojiBrowser ? '' : 'hidden'} duration-200"
            />

            <GifBrowser
                    bind:show={gifBrowser}
                    on:blurred={() => {
					gifBrowser = false;
				}}
                    on:selected={(event) => {
					sendMessage(event.detail.images.original.url);
                    gifBrowser = false;
				}}
                    class="absolute bottom-28 right-5 h-96 w-96 bg-slate-700 rounded-lg border-2 border-slate-800  p-2 scrollbar-hidden"
            />

            <div
                    class="relative group flex gap-3 m-2 text-slate-100 group-focus:ring-2 group-focus:ring-slate-500 px-3 rounded bg-slate-800 duration-200 ring-1 ring-slate-700"
            >
                <EmojiSuggestion
                        show={showEmojiSuggestion}
                        searchString={emojiSearchString}
                        on:suggest={(event) => {
						removeFromInput(
							currentCursorPosition - emojiSearchString.length - 1,
							emojiSearchString.length
						);
						addToInput(event.detail.char, currentCursorPosition - emojiSearchString.length - 1);
						currentCursorPosition += event.detail.char.length;
						showEmojiSuggestion = false;
						justInsertedEmoji = true;
					}}
                        class="bottom-full mb-3 w-full bg-slate-800 rounded p-2 left-0 right-0"
                />

                <input
                        class="flex-1 placeholder-slate-300 group-focus:placeholder-slate-200 focus:outline-0 bg-transparent"
                        spellcheck="false"
                        placeholder="Write something..."
                        type="text"
                        bind:value={textfield}
                        bind:this={textinput}
                        on:input={(event) => {
						currentCursorPosition = event.target.selectionStart;
						let before = textfield.substring(0, event.target.selectionStart);
						if (isSearchingEmote(before)) {
							const parts = textfield.substring(0, currentCursorPosition).split(' ');
							const lastPart = parts[parts.length - 1];
							emojiSearchString = lastPart.substring(1);
							showEmojiSuggestion = true;
						} else {
							showEmojiSuggestion = false;
						}
					}}
                        on:keydown={(event) => {
						if (!showEmojiSuggestion && !justInsertedEmoji) {
							if (event.key === 'Enter') sendMessage(textfield);
						} else {
							justInsertedEmoji = false;
						}
					}}
                />
                <div class="flex">
                    <button
                            class="hover:scale-110 text-4xl filter-gray duration-200 p-3 text-lime-500 text-2xl grid justify-center rounded grayscale hover:grayscale-0"
                            on:click={() => {
							toggleGif();
						}}
                    >
                        <Icon icon="material-symbols:gif-box-outline"/>
                    </button>
                    <button
                            class="hover:scale-110 filter-gray duration-200 py-3 text-sky-500 text-2xl grid justify-center rounded grayscale hover:grayscale-0"
                            on:click={() => {
							toggleEmoji();
						}}
                    >
                        😅
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
