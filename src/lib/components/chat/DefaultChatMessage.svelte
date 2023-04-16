<script lang="ts">
    import type {Message} from "./ChatFormatter";
    import {fly} from "svelte/transition";
    import {colorFromName, toHslString} from "$lib/components/chat/chatUtils";

    export let message: Message;

</script>

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