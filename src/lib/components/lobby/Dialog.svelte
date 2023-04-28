<script lang="ts">

    import {createEventDispatcher} from "svelte";

    export let element = null;
    const dispatch = createEventDispatcher();


    export function close() {
        dialog.close();

    }

    export function open() {
        dialog.showModal();
    }

    let dialog: HTMLDialogElement;

    function resolve(...args: any[]) {
        dispatch("resolve", args);
    }
</script>


{#if element}
    <dialog bind:this={dialog}>
        <svelte:component this={element} on:close={() => {close()}} {resolve}/>
    </dialog>
{/if}

