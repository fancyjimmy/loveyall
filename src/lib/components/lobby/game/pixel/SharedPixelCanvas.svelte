<script lang="ts">
    import {onMount} from 'svelte';
    import {Socket} from 'socket.io-client';
    import {role} from '../../../../../routes/lobby/[lobbyId]/gameStore.js';

    let canvas: HTMLCanvasElement;

    export let socket: Socket;

    type Color = {
        r: number;
        g: number;
        b: number;
    };

    let width = 100;
    let height = 100;

    function setImage(pixels: (Color | null)[][]) {
        for (let y = 0; y < pixels.length; y++) {
            for (let x = 0; x < pixels[y].length; x++) {
                const pixel = pixels[y][x];
                if (pixel === null) continue;
                ctx.fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    function getInitialImage() {
        loading = false;
        socket.emit('pixel:initialImage', (pixels: (Color | null)[][]) => {
            height = pixels.length;
            width = pixels[1].length;
            canvas.width = width;
            canvas.height = height;

            canvas.addEventListener('mousemove', quickDrawingCallback);
            canvas.addEventListener('mousedown', singleDrawingCallback);

            setTimeout(() => setImage(pixels), 200);
        });
    }

    $: ctx = canvas?.getContext('2d');

    let drawingMode: 'quick' | 'single' = 'single';

    function listenToPixelChanges() {
        socket.on('pixel-change', (x: number, y: number, color: Color | null) => {
            drawPixel(x, y, color);
        });
    }

    function drawPixel(x: number, y: number, color: Color | null) {
        if (color === null) {
            ctx.clearRect(x, y, 1, 1);
        } else {
            ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    function setPixel(x: number, y: number, color: Color | null) {
        if (colorMode === 'erase') color = null;
        drawPixel(x, y, color);
        socket.emit('pixel:updatePixel', x, y, color);
    }

    let loading = true;

    function hexToColor(hex: string): Color {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return {r, g, b};
    }

    const quickDrawingCallback = (event) => {
        if (drawingMode !== 'quick') return;

        if (event.buttons === 1) {
            let rect = canvas.getBoundingClientRect();

            let x = (event.clientX - rect.left) * (canvas.width / rect.width);
            let y = (event.clientY - rect.top) * (canvas.height / rect.height);

            setPixel(Math.floor(x), Math.floor(y), hexToColor(color));
        }
    };

    const singleDrawingCallback = (event) => {
        let rect = canvas.getBoundingClientRect();
        let x = (event.clientX - rect.left) * (canvas.width / rect.width);
        let y = (event.clientY - rect.top) * (canvas.height / rect.height);

        setPixel(Math.floor(x), Math.floor(y), hexToColor(color));
    };

    onMount(() => {
        getInitialImage();
        listenToPixelChanges();

        return () => {
            canvas.removeEventListener('mousemove', quickDrawingCallback);
            canvas.removeEventListener('mousedown', singleDrawingCallback);
        };
    });
    let color = '#FF0000';

    function download() {
        const link = document.createElement('a');
        link.download = 'image.png';
        link.href = canvas.toDataURL();
        link.click();
    }

    $: realCanvasHeight = container?.clientHeight - 12 ?? 0;
    $: realCanvasWidth = container?.clientWidth - 12 ?? 0;

    let container: HTMLDivElement;
    let colorMode: 'color' | 'erase' = 'color';
</script>

<div class="w-full h-full pixelbackground bg-sky-400 pixel-font text-xl">
    {#if loading}
        <div class="w-full h-full flex items-center justify-center">
            <p>Loading...</p>
        </div>
    {:else}
        <div class="flex w-full h-full flex-col gap-2">
            <div class="p-8">
                <div class="bg-white bordered p-2 font-semibold text-2xl">Pixel Draw Together</div>
            </div>

            <div class="flex-1 flex p-8 pt-0">
                <div class="w-48 flex flex-col gap-3">
                    {#if $role === 'host'}
                        <button
                                class="bordered bg-red-500 p-3 hover:bg-orange-500 duration-200"
                                on:click={() => {
								socket.emit('pixel:end', (response) => {
									console.log(response);
								});
							}}
                        >End
                        </button>
                    {/if}

                    <div class="bordered bg-white flex flex-col flex-1 items-center gap-3 p-3 relative">
                        <input type="color" bind:value={color} class=" input-color"/>
                        <button
                                class:quick-mode={drawingMode === 'quick'}
                                on:click={() => {
								drawingMode = drawingMode === 'quick' ? 'single' : 'quick';
							}}
                                class="p-3 bordered-thin bg-sky-500 w-full">{drawingMode}</button
                        >
                        <button
                                on:click={() => {
								colorMode = colorMode === 'color' ? 'erase' : 'color';
							}}
                                class="p-3 bordered-thin {colorMode === 'color' ? 'color-mode' : 'no-opacity'} w-full"
                                style="--color: {color}"
                        ><span class="contrasting">{colorMode}</span></button
                        >
                        <button on:click={download} class="p-3 bottom-3 absolute hover:text-blue-700 duration-200">
                            Download
                        </button>
                    </div>
                </div>

                <div class="flex-1 flex items-center justify-center" bind:this={container}>
                    <canvas
                            {width}
                            {height}
                            bind:this={canvas}
                            style="--pixelsize: {Math.min(
							realCanvasHeight / height,
							realCanvasWidth / width
						)}; height: {Math.min(realCanvasHeight, realCanvasWidth)}px; width: {Math.min(
							realCanvasHeight,
							realCanvasWidth
						)}px;"
                            class="bordered"
                    />
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');

    canvas {
        object-fit: contain;
        margin: 0px;
        box-sizing: content-box;
        background-image: url('/no-opacity.png');
        --pixelsize: 16;
        background-size: calc(var(--pixelsize) * 2px);
        image-rendering: pixelated;
    }

    @keyframes moving {
        0% {
            background-position: 0px 0px;
        }
        100% {
            background-position: 100% 100%;
        }
    }

    .no-opacity {
        background-image: url('/no-opacity.png');
        --pixelsize: 32;
        background-size: calc(var(--pixelsize) * 2px);
        image-rendering: pixelated;
    }

    .color-mode {
        --color: #1000f5;
        background-color: var(--color);
    }

    .color-model span.contrasting {
        mix-blend-mode: difference;
        color: chocolate;
    }


    .quick-mode {
        @apply bg-green-500;
    }

    .bordered {
        box-shadow: -10px 10px 0px 0px black;
        border: 6px solid black;
    }

    .bordered-thin {
        border: 6px solid black;
    }

    .pixel-font {
        font-family: 'Comic Sans MS', sans-serif;
    }

    .pixelbackground {
        background-image: url('/pencil.png');
        image-rendering: pixelated;
        animation: moving 100s linear infinite;
    }

    input[type='color']::-moz-color-swatch {
        border: none;
    }

    input[type='color']::-webkit-color-swatch-wrapper {
        padding: 0;
        border-radius: 0;
    }

    input[type='color']::-webkit-color-swatch {
        border: none;
    }

    .input-color {
        width: calc(100%);
        height: auto;
        box-sizing: border-box;
        aspect-ratio: 1;
        border: 6px solid black;
    }
</style>
