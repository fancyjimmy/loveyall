<script lang="ts">
    import {fly} from "svelte/transition";
    import type {Message} from "$lib/components/chat/ChatFormatter";

    export let message: Message;
</script>

<article
        class="w-full p-2 bg-yellow-200 rounded-lg shadow-lg flex flex-col"
        in:fly={{ key: message.id, y: 20 }}
>
    <p>
        {message.message}
    </p>
    <p>
        {new Date(message.time).toLocaleTimeString()}
    </p>
</article>


<style lang="postcss">

</style>