<script lang="ts">
  import { role } from "$lib/components/lobby/gameStore.js";

  export let socket;
  export let time;
  export let text;

  socket.emit("typeracer:state", (result) => {

  });
</script>

{#if $role === "host"}
  <button class="bg-red-500" on:click={() => {
  socket.emit("end");
}}>End
  </button>
{/if}

<p>{text}</p>