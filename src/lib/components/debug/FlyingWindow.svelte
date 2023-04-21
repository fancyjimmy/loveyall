<script lang="ts">
    import {draggable} from "$lib/util";

    export let x = 300;
    export let y = 300;
    export let moveAble;

</script>
{#if moveAble}
    <div class="absolute z-[100] {$$props.class}" use:draggable={{x: x, y: y}}>
        <div class="flex-1">
            <slot/>
        </div>
    </div>
{:else}
    <div class="fixed z-[100] {$$props.class}">
        <div class="flex-1">
            <slot/>
        </div>
    </div>
{/if}
