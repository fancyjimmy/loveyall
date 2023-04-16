<script lang="ts">
    import {fade, fly} from 'svelte/transition';
    import {flip} from "svelte/animate";
    import {colorFromName, darken, toHslString} from "$lib/components/chat/chatUtils";

    export let users = [];
    export let self;


</script>
<div class="scrollbar-hidden h-8 gap-2 flex overflow-x-auto mt-2">
    {#each users.filter((user) => user.name !== self.name) as user (user.name)}
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
