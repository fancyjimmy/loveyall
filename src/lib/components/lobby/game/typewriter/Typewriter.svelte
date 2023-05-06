<script lang="ts">

  import StateStack from "$lib/components/lobby/game/typewriter/StateStack.svelte";
  import TypewriterStartingScreen from "$lib/components/lobby/game/typewriter/states/TypewriterStartingScreen.svelte";

  export let socket;
</script>

<StateStack {socket} startState={{component: TypewriterStartingScreen, props: {}}}></StateStack>