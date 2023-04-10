<script>
    import Chat from "$lib/components/Chat.svelte";

    export let data;
</script>

<a href="/chat">back</a>

<Chat room={data.room}>

</Chat>