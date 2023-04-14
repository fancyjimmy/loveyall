<script lang="ts">
    import "../app.css"
    import {onMount} from "svelte";
    import {io} from "../lib/WebsocketConnection";

    onMount(() => {
        io.on("error", (err) => {
            console.error(err);
        })
    })
</script>

<slot/>