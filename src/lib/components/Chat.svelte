<script>
    import {onMount} from "svelte";
    import {io} from "$lib/WebsocketConnection";

    export let room = "";
    export let user = "";

    let textfield = '';
    let name = "";
    let messages = [];
    let loaded = false;

    function updateName(n) {
        name = n;
        loaded = true;
    }

    function updateMessages(msg) {
        messages = [...messages, msg];
    }

    onMount(() => {
        user = sessionStorage.getItem("user");
        if (!user) {
            user = prompt("What is your name?");
            sessionStorage.setItem("user", user);
            name = user;
        }

        io.emit(`chat:${room}:join`, {name: user});
        io.on("message", updateMessages);
        io.on("name", updateName);

        return () => {
            io.emit(`chat:${room}:leave`);
            io.off("message", updateMessages);
            io.off("name", updateName);
        }
    });

    function sendMessage() {
        const message = textfield.trim();
        if (!message) return;

        textfield = '';
        io.emit(`chat:${room}:message`, {message});
        messages = [...messages, {user: "You", message, time: Date.now()}];
    }
</script>

<div>
    <h3>Room: {room}</h3>
    <h3>Username: {name}</h3>

    <div>
        <h4>Messages</h4>
        <ul>
            {#each messages as message}
                <li>{message.user} {new Date(message.time).toLocaleString()}: {message.message}</li>
            {/each}
        </ul>
    </div>
    <div>
        <input type="text" bind:value={textfield}>
        <button on:click={sendMessage}>Send</button>
    </div>
</div>