<script lang="ts">
    import {emojis} from '$lib/components/chat/emoji/emojis';
    import {createEventDispatcher} from "svelte";


    let dispatch = createEventDispatcher();
    let groups = [
        'Smileys & Emotion',
        'Symbols',
        'People & Body',
        'Activities',
        'Objects',
        'Travel & Places',
        'Food & Drink',
        'Animals & Nature'
    ];

    let groupValues = groups.map((group) => {
        return {name: group, emojis: emojis.filter((emoji) => emoji.group === group)};
    });
    let filter = '';

    let hovered = '';
    let hoveredGroup = '';
</script>

<div
        class=" absolute bottom-28 right-5 h-96 w-96 flex flex-col p-3 bg-slate-700 rounded-lg border-2 border-slate-800 {$$props.class}"
>
    <input
            placeholder=":emoji:"
            type="text"
            bind:value={filter}
            class="text-slate-100 focus:ring-2 focus:ring-slate-500 placeholder-slate-300 focus:placeholder-slate-200 p-2 rounded bg-slate-800 duration-200 ring-1 ring-slate-700 focus:outline-0"
    />

    <div class="flex-1 overflow-y-scroll scrollbar-hidden">
        {#each groupValues as group}
            <p class="m-3 text-2xl text-white font-semibold">{group.name}</p>
            <div
                    class="grid grid-cols-7 text-4xl"
                    on:mouseover={(event) => {
					hovered = event.target.innerText;
				}}
            >
                {#each group.emojis.filter((emoji) => emoji.name.includes(filter.toLowerCase())) as emoji}
                    <div class="hover:bg-slate-500 rounded aspect-square items-center flex select-none text-center align-middle"
                         on:click={()=>{dispatch("selected", emoji)}}>{emoji.char}</div>
                {/each}
            </div>
        {/each}
    </div>
    <div class="flex h-12 items-center">
		<span class="text-4xl aspect-square">
			{hovered.length <= 3 ? hovered : ''}
		</span>
        <span class="font-bold flex-1 text-xl text-white">
			{#if hovered.length <= 2 && hovered.length !== 0}
				:{emojis.find((emoji) => emoji.char === hovered)?.name ?? ''}:
			{/if}
		</span>
    </div>
</div>
