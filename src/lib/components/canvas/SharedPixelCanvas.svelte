<script lang="ts">
    import {onMount} from "svelte";
    import {Socket} from "socket.io-client";


    let canvas: HTMLCanvasElement;

    export let socket: Socket;

    type Color = {
        r: number,
        g: number,
        b: number,
    };


    let width = 100;
    let height = 100;

    function getInitialImage() {
        loading = false;
        socket.emit('pixel:initialImage', (pixels: Color[][]) => {
            height = pixels.length;
            width = pixels[1].length;
            canvas.width = width;
            canvas.height = height;

            canvas.addEventListener("mousedown", (event) => {
                let rect = canvas.getBoundingClientRect();

                let x = (event.clientX - rect.left) * (canvas.width / rect.width);
                let y = (event.clientY - rect.top) * (canvas.height / rect.height);
                setPixel(Math.floor(x), Math.floor(y), hexToColor(color));
            });

            for (let y = 0; y < pixels.length; y++) {
                for (let x = 0; x < pixels[y].length; x++) {
                    const pixel = pixels[y][x];
                    ctx.fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });
    }

    $: ctx = canvas?.getContext('2d');

    function listenToPixelChanges() {
        socket.on("pixel-change", (x: number, y: number, color: Color) => {
            drawPixel(x, y, color);
        });
    }

    function drawPixel(x: number, y: number, color: Color) {
        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.fillRect(x, y, 1, 1);
    }


    function setPixel(x: number, y: number, color: Color) {
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

    onMount(() => {
        getInitialImage();
        listenToPixelChanges();
    })
    let color = "#000000"
</script>

{#if loading}
    <p>Loading</p>
{:else}
    <input type="color" bind:value={color}>
    <canvas width="{width}" height="{height}" bind:this={canvas}></canvas>
{/if}

<style>
    canvas {
        height: 400px;
        image-rendering: pixelated;
    }
</style>