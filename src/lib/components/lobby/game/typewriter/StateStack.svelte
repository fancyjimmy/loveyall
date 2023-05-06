<script lang="ts">
  import { onMount, SvelteComponent } from "svelte";

  export let startState: State;

  let states: State[] = [];


  type State = {
    component: SvelteComponent;
    props: any;
  }

  $: currentState = states[states.length - 1];

  type StateChangeEvent = {
    action: "push" | "pop";
    component?: SvelteComponent;
    count?: number;
    args?: any;
  }

  function changeState(event: CustomEvent<StateChangeEvent>) {
    if (event.detail.action === "push") {
      pushState(event.detail.component!, event.detail.args);
    } else if (event.detail.action === "pop") {
      popState(event.detail.count);
    }
  }

  function pushState(state: SvelteComponent, args: any) {
    states = [...states, { component: state, props: args }];
  }

  function popState(count: number = 1) {
    states = states.slice(0, states.length - count);
  }

  onMount(() => {
    states = [startState];
  });
</script>
{#if currentState}
  <svelte:component this={currentState.component} on:stateChange={changeState} {popState} {pushState}
                    {...currentState.props} {...$$props} />
{/if}
