<script lang="ts">
    import Chat from "$lib/components/chat/Chat.svelte";
    import Icon from "@iconify/svelte";
</script>

<Chat room="general" class="w-screen h-screen">
    <a href="/chat" slot="icon" class="inline-flex text-white mr-4 items-center">
        <Icon icon="material-symbols:arrow-back-ios-new"/>
        Rooms
    </a>
</Chat>
