<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { Socket } from "socket.io-client";
  import TypewriterMainScreen from "./TypewriterMainScreen.svelte";
  import { role, username } from "$lib/components/lobby/gameStore";

  const dispatch = createEventDispatcher();

  let players = [];
  export let pushState;
  export let popState;

  export let socket: Socket;

  onMount(() => {
    socket.emit("typeracer:players", (p) => {
      players = p;
    });

    const readyListener = (player) => {
      players = players.map((p) => {
        if (p.name === player) {
          p.ready = true;
        }
        return p;
      });
    };
    socket.on("ready", readyListener);

    const startTypingListener = ({ text, time }) => {
      pushState(TypewriterMainScreen, { text, time });
    };

    socket.on("start-typing", startTypingListener);

    return () => {
      socket.removeListener("ready", readyListener);
      socket.removeListener("start-typing", startTypingListener);
    };


  });
</script>

<p>Hello {new Date().toLocaleString()}</p>
{#if $role === "host"}
  <button class="bg-red-500" on:click={() => {
  socket.emit("end");
}}>End
  </button>
{/if}

<div class="bg-green-500 p-2 flex gap-2 ">
  {#each players as player}
    <div class="bg-pink-500 p-2 rounded" class:ready={player.ready}>
      <p>{player.name}</p>
    </div>
  {/each}
</div>

<button class="bg-green-500 p-3 disabled:bg-gray-500"
        disabled={players.some((player) => {return (player.name === $username) && player.ready} )}
        on:click={() => socket.emit('typeracer:start')}> start
</button>


<style>
    .ready {
        background-color: green;
    }
</style>
