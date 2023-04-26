<script lang="ts">
    import {GifsResult, GiphyFetch} from '@giphy/js-fetch-api';
    import {createEventDispatcher, onMount} from 'svelte';
    import {PUBLIC_GIPHY_SDK_KEY} from '$env/static/public';

    import {clickOutside} from '$lib/util';

    let dispatch = createEventDispatcher();

    // create a GiphyFetch with your api key
    // apply for a new Web SDK key. Use a separate key for every platform (Android, iOS, Web)
    const gf = new GiphyFetch(PUBLIC_GIPHY_SDK_KEY);
    // create a fetch gifs function that takes an offset
    // this will allow the grid to paginate as the user scrolls
    const fetchGifs = (offset: number) => {
        // use whatever end point you want,
        // but be sure to pass offset to paginate correctly
        let limit = 16;
        return gf.trending({offset: offset * limit, limit});
    };

    let cols = 2;
    let gifs = Array.from({length: cols}).reduce((acc, _, i) => {
        acc[i] = [];
        return acc;
    }, {} as Record<number, any[]>);

    function splitArray(arr: any[], n: number) {
        let len = arr.length,
            out = [],
            i = 0;
        while (i < len) {
            let size = Math.ceil((len - i) / n--);
            out.push(arr.slice(i, (i += size)));
        }
        return out;
    }

    function fetchInto(gifRes: any[]) {
        let parts = splitArray(gifRes, cols);

        for (let i = 0; i < parts.length; i++) {
            gifs[i] = [...gifs[i], ...parts[i]];
        }
    }

    let intersectionObserver;

    let fetched = 0;

    let alreadyObserved = 0;

    onMount(async () => {
        // Instantiate
        let gifResult: GifsResult = await fetchGifs(fetched);

        fetchInto(gifResult.data);

        intersectionObserver = new IntersectionObserver(
            async () => {
                const newGifs = await fetchGifs(++fetched);
                fetchInto(newGifs.data);
                alreadyObserved = 0;
            },
            {
                root: root,
                rootMargin: '0px',
                threshold: 0.5
            }
        );

        // To remove
        return () => {
        };
    });
    let observed = {
        0: null,
        1: null,
    };
    let root;

    export let show = false;

    $: if (show) {
        for (let i = 0; i < cols; i++) {
            let part = observed[i];

            if (!part) continue;
            intersectionObserver.observe(part);
        }
    }
    ;

    let filter;
</script>

{#if show}
    <div
            class="{$$props.class} flex flex-col"
            bind:this={root}
            use:clickOutside
            on:click_outside={() => {
			dispatch('blurred');
		}}
    >
        <input
                placeholder="Search Giphy"
                type="text"
                bind:value={filter}
                class="mb-2 text-slate-100 focus:ring-2 focus:ring-slate-500 placeholder-slate-300 focus:placeholder-slate-200 p-2 rounded bg-slate-800 duration-200 ring-1 ring-slate-700 focus:outline-0"
        />

        <div
                class="overflow-y-scroll scrollbar-hidden grid gap-3 flex-1 dynamic-grid"
                style="--cols: {cols} "
        >
            {#each Object.keys(gifs) as key, i}
                <div class="flex flex-col gap-3">
                    {#each gifs[key] as gif}
                        <div
                                on:click={() => {
								dispatch('selected', gif);
							}}
                        >
                            <img
                                    src={gif.images.preview_gif.url}
                                    alt={gif.title}
                                    class="rounded object-cover w-full"
                            />
                        </div>
                    {/each}
                    <div bind:this={observed[i]} class="bg-slate-600 h-40 rounded"/>
                    {#each Array.from({length: cols}) as _, i}
                        <div class="bg-slate-600 h-40 rounded"/>
                    {/each}
                </div>
            {/each}
        </div>
    </div>
{/if}


<style>
    .dynamic-grid {
        --cols: 2;

        grid-template-columns: repeat(var(--cols), 1fr);
    }
</style>