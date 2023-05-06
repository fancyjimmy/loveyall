<script lang="ts">

  import { onMount } from "svelte";

  export let nextComponent;
  export let nextComponentProps;
  export let time = 5;

  export let pushState;
  export let popState;

  function openNextComponent() {
    popState(1);
    pushState(nextComponent, nextComponentProps);
  }

  let timePassed;
  onMount(() => {
    timePassed = time;
    for (let i = 0; i < time; i++) {
      setTimeout(() => {
        timePassed--;
      }, i * 1000);
    }
    setTimeout(() => {
      openNextComponent();
    }, time * 1000);
  });
</script>


<p>{timePassed + 1 }</p>

