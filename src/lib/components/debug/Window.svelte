<script lang="ts">
    import {afterUpdate, beforeUpdate} from 'svelte';
    import FlyingWindow from '$lib/components/debug/FlyingWindow.svelte';


    let consoleElement;
    let autoscroll;

    let scrollThreshold = 20;
    beforeUpdate(() => {
        if (showing) {
            autoscroll =
                consoleElement &&
                consoleElement.offsetHeight + consoleElement.scrollTop >
                consoleElement.scrollHeight - scrollThreshold;
        }
    });

    afterUpdate(() => {
        if (showing) {
            if (autoscroll) consoleElement.scrollTo(0, consoleElement.scrollHeight);
        }
    });

    let minified = false;
    let closed = false;

    $: showing = !(minified || closed);

    function minify() {
        minified = !minified;
        maximized = false;
    }

    let maximized;

    function maximize() {
        maximized = !maximized;
        minified = false;
    }

    function close() {
        closed = true;
        minified = false;
        maximized = false;
    }

    function show() {
        closed = false;
        minified = false;
        maximized = false;
    }

    export let windowTitle = "Window";


</script>

<FlyingWindow class="shadow-lg {closed ? 'top-0 right-5' : ''}" moveAble={!maximized && !closed} x={600}>
    {#if !closed}
        <div
                class="rounded-lg bg-black text-white font-mono top-0 right-0 min-w-[100px 3qt4qy 1] duration-200 z-[5] flex flex-col overflow-hidden cursor-default m-0"
                class:full-screen={maximized}
        >
            <div class="bg-gray-800 relative flex justify-center">
                <div class="flex absolute left-2 top-0 bottom-0 my-auto items-center gap-1">
                    <button
                            class="rounded-full h-4 w-4 bg-red-500 border border-red-800"
                            on:click={() => {
                            close()
						}}
                    />
                    <button
                            class="rounded-full h-4 w-4 bg-yellow-500 border border-yellow-800"
                            on:click={() => {
							minify();
						}}
                    />
                    <button
                            class="rounded-full h-4 w-4 bg-green-500 border border-green-800"
                            on:click={() => {
							maximize();
						}}
                    />
                </div>
                <p class="text-white font-semibold">{windowTitle}</p>
            </div>
            {#if !minified}
                <slot/>
            {/if}
        </div>
    {:else}
        <button
                class="rounded-full h-6 w-6 bg-sky-500"
                on:click={() => {
                    show()
						}}></button>
    {/if}
</FlyingWindow>

<style>
    .full-screen {
        @apply w-screen h-screen top-0 left-0 rounded-none;
    }
</style>
