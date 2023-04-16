<script lang="ts">
    import Chat from "$lib/components/chat/Chat.svelte";
    import Icon from "@iconify/svelte";

    export let data;
</script>

<div class="w-screen h-screen flex scrollbar-hidden overflow-hidden">
    <Chat room={data.room} class="scrollbar-hidden">
        <a slot="icon" href="/chat" class="pr-3">
            <Icon icon="material-symbols:arrow-back-ios-new"/>
        </a>
    </Chat>
</div>
