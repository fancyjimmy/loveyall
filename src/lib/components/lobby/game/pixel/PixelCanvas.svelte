<script lang="ts">
  import { onMount } from "svelte";
  import { Socket } from "socket.io-client";
  import { role } from "../../gameStore.js";

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
    socket.emit("pixel:initialImage", (pixels: (Color | null)[][]) => {
      height = pixels.length;
      width = pixels[1].length;
      canvas.width = width;
      canvas.height = height;

      canvas.addEventListener("mousemove", quickDrawingCallback);
      canvas.addEventListener("mousedown", singleDrawingCallback);

      setTimeout(() => setImage(pixels), 200);
    });
  }

  $: ctx = canvas?.getContext("2d");

  let drawingMode: "quick" | "single" = "quick";

  let brushSize = 1;

  function listenToPixelChanges() {
    socket.on("pixel-change", (x: number, y: number, color: Color | null) => {
      drawPixel(x, y, color);
    });

    socket.on(
      "pixel-fill",
      (x: number, y: number, width: number, height: number, color: Color | null) => {
        fillArea(x, y, width, height, color);
      }
    );
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
    let rgb = ctx.getImageData(x, y, 1, 1).data;
    if (rgb[0] === color?.r && rgb[1] === color?.g && rgb[2] === color?.b && colorMode !== "erase")
      return;
    if (colorMode === "erase") color = null;
    drawPixel(x, y, color);
    socket.emit("pixel:updatePixel", x, y, color);
  }

  let loading = true;

  function hexToColor(hex: string): Color {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b };
  }

  const quickDrawingCallback = (event) => {
    if (drawingMode !== "quick") return;

    if (event.buttons === 1) {
      let rect = canvas.getBoundingClientRect();

      let x = (event.clientX - rect.left) * (canvas.width / rect.width);
      let y = (event.clientY - rect.top) * (canvas.height / rect.height);

      if (brushSize > 1) {
        const col = hexToColor(color);
        let rgb = ctx.getImageData(x, y, 1, 1).data;
        if (rgb[0] === col?.r && rgb[1] === col?.g && rgb[2] === col?.b && colorMode !== "erase")
          return;
        drawThickPixel(x, y, brushSize, col);
        return;
      }
      setPixel(Math.floor(x), Math.floor(y), hexToColor(color));
    }
  };

  function fillArea(x: number, y: number, width: number, height: number, color: Color | null) {
    if (color === null) {
      ctx.clearRect(x, y, width, height);
    } else {
      ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
      ctx.fillRect(x, y, width, height);
    }
  }

  const singleDrawingCallback = (event) => {
    //if (drawingMode !== 'single') return;

    let rect = canvas.getBoundingClientRect();
    let x = (event.clientX - rect.left) * (canvas.width / rect.width);
    let y = (event.clientY - rect.top) * (canvas.height / rect.height);

    if (brushSize > 1) {
      drawThickPixel(x, y, brushSize, hexToColor(color));
      return;
    }
    setPixel(Math.floor(x), Math.floor(y), hexToColor(color));
  };

  function setPixelFill(x: number, y: number, width: number, height: number, color: Color | null) {
    fillArea(x, y, width, height, color);
    socket.emit("pixel:fillPixel", x, y, width, height, color);
  }

  function drawThickPixel(x: number, y: number, size: number, color: Color | null) {
    let startX = Math.floor(x - size / 2);
    let startY = Math.floor(y - size / 2);

    if (colorMode === "erase") {
      color = null;
    }
    setPixelFill(startX, startY, size, size, color);
  }

  onMount(() => {
    getInitialImage();
    listenToPixelChanges();

    return () => {
      canvas.removeEventListener("mousemove", quickDrawingCallback);
      canvas.removeEventListener("mousedown", singleDrawingCallback);
      socket.removeAllListeners("pixel-fill");
      socket.removeAllListeners("pixel-change");
    };
  });
  let color = "#793737";

  function download() {
    const link = document.createElement("a");
    link.download = "image.png";
    link.href = canvas.toDataURL();
    link.click();
  }

  let container: HTMLDivElement;
  let colorMode: "color" | "erase" = "color";

  $: aspectRatio = width / height;

  let realHeight = 450;

  const maxBrushSize = 6;
</script>

<div class="w-full h-screen pixelbackground bg-sky-400 pixel-font text-xl">
  {#if loading}
    <div class="w-full h-full flex items-center justify-center">
      <p>Loading...</p>
    </div>
  {:else}
    <div class="grid w-full h-full grid-rows-[5rem,1fr] gap-8">
      <div class="p-8">
        <div class="bg-white bordered p-2 font-semibold text-2xl">Pixel Draw Together</div>
      </div>

      <div class="m-0 inset-0 grid grid-cols-[12rem,1fr] p-8 pt-0">
        <div class="flex flex-col gap-3">
          {#if $role === 'host'}
            <button
              class="bordered bg-red-500 p-3 hover:bg-red-700 duration-200"
              on:click={() => {
								socket.emit('pixel:end', (response) => {
									console.log(response);
								});
							}}
            >End
            </button>
          {/if}

          <div class="bordered bg-white flex flex-col flex-1 items-center gap-3 p-3 relative">
            <input type="color" bind:value={color} class=" input-color" />
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
              style="--color: {color}"><span class="contrasting">{colorMode}</span></button
            >

            <button
              on:click={() => {
								brushSize = Math.max((brushSize + 1) % maxBrushSize, 1);
							}}
              class="p-3 bordered-thin w-full flex items-center justify-between"
              style="--color: {color}"
            >
              <div class="bg-black" style="width: {brushSize * 5}px; height: {brushSize * 5}px" />
              {brushSize}</button
            >

            {#if $role === 'host'}
              <button
                class="w-full bordered-thin bg-blue-300 p-3 hover:bg-blue-500 duration-200"
                on:click={() => {
									socket.emit('pixel:clear', (response) => {
										console.log(response);
									});
								}}
              >Clear
              </button>
            {/if}
            <button
              on:click={download}
              class="p-3 bottom-3 absolute hover:text-blue-700 duration-200"
            >
              Download
            </button>
          </div>
        </div>

        <div class="relative min-h-0 grow-0" bind:this={container}>
          <div class="relative overflow-hidden w-full h-full">
            <canvas
              {width}
              {height}
              bind:this={canvas}
              style="--pixelsize: {realHeight /
								height}; height: {realHeight}px; margin:auto; inset:0; width: {realHeight *
								aspectRatio}px;"
              class="bordered absolute"
            />
          </div>

          <div class="absolute bottom-0 inset-x-0">
            <input
              type="range"
              bind:value={realHeight}
              min="200"
              max="2000"
              step="5"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
    canvas {
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
