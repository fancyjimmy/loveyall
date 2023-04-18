<script lang="ts">
    import type {Emoji} from './emojis';
    import {emojis} from './emojis';
    import {createEventDispatcher} from "svelte";

    export let searchString = '';

    let dispatch = createEventDispatcher();

    function getMatching(value: string): Emoji[] {
        return emojis.filter((emoji) => emoji.name.includes(value));
    }

    let matchingEmojis = [];
    $: matchingEmojis = getMatching(searchString.toLowerCase()).slice(0, 10);

    let selected = 0;

    const mod = (n, m) => (n % m + m) % m;

    function up(count: number) {
        selected = mod(selected + count, matchingEmojis.length);
    }

    function scrollAble(node) {

        const handleKeypress = event => {
            if (event.key === "Enter" || event.key === "Tab") {
                event.preventDefault();
                dispatch("suggest", matchingEmojis[selected]);
            }
            if (event.key === "ArrowUp") {
                up(-1);
            } else if (event.key === "ArrowDown") {
                up(1);
            }
        }

        document.addEventListener('keydown', handleKeypress, true);

        return {
            destroy() {
                document.removeEventListener('keydown', handleKeypress, true);
            }
        }
    }

    export let show = false;
</script>

{#if matchingEmojis.length >= 1 && show}

    <div class="{$$props.class} absolute flex flex-col" use:scrollAble>

        <div class="text-sm text-slate-200 font-semibold mb-3">
            EMOJIS MATCHING <span class="font-bold text-white">:{searchString.toLowerCase()}</span>
        </div>
        {#each matchingEmojis as emoji, i}
            <div class="w-full p-1 hover:bg-slate-700" class:selected={selected === i}
                 on:click={dispatch("suggest", emoji)}>
				<span class="text-2xl">
					{emoji.char}
				</span>
                <span class="font-semibold text-ellipse">:{emoji.name}:</span>
            </div>
        {/each}

    </div>
{/if}

<style>
    .selected {
        @apply bg-slate-700;
    }
</style>