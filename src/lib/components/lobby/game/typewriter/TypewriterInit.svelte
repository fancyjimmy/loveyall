<script lang="ts">
  import { role } from "$lib/components/lobby/gameStore.js";

  let seconds = 60;

  export let socket;

  function setTime() {
    socket.emit("settings", seconds);
  }
</script>

{#if $role === 'host'}
  <button on:click={setTime}> Create {seconds}</button>
  <input type="range" min="30" max="180" step="10" bind:value={seconds} />
{:else}
  <p>Waiting for them to finish</p>
{/if}
