<script lang="ts">
    import {game as f} from "../lib/uno";
    import {browser} from "$app/environment";

    let game = f;


    if (browser) {
        setInterval(() => {
            game = game;
        }, 1000);
    }
</script>
<div class="w-screen h-screen bg-slate-700 items-center flex gap-4 flex-col">
    <h1 class="text-4xl font-mono">[PLACEHOLDER]</h1>
    <div class="flex flex-col items-center gap-2 w-96">
        <a class="p-3 bg-sky-500 hover:bg-sky-600 duration-200 w-full text-center" href="/lobby">Lobby</a>
        <a class="p-3 bg-sky-500 hover:bg-sky-600 duration-200 w-full text-center" href="/chat">Chat</a>
        <a class="p-3 bg-sky-500 hover:bg-sky-600 duration-200 w-full text-center" href="/general">General</a>
    </div>

</div>
<!--
<div class="game">
    <div class="players">
        {#each game.players as player }
            <div class:active-player={game.currentPlayer === player} class="player">
                <h2>{player.name} #{player.hand.length}</h2>
                <ul>
                    {#each player.hand as card, i}
                        <li class="{card.color} uno-card" on:click={() => {
                            if (game.currentPlayer === player) {
                                if (card.type === "wild" || card.type === "draw4"){
                                    const color = prompt("What color do you want to change to?");
                                    if (["red", "blue", "green", "yellow"].includes(color)){
                                        card.color = color;
                                    } else {
                                        alert("Invalid color");
                                        return;
                                    }
                                }
                                player.playCard(card);
                            }
                        }}>
                            <p style="position: absolute; top: 0px;">{i + 1}</p>
                            <p>
                                {card.value}
                            </p>
                        </li>
                    {/each}
                </ul>

            </div>

        {/each}
    </div>

    <div class="deal">

        <button class="draw" on:click={() => {
            game.currentPlayer.drawCard();
        }}>Draw</button>

        <div class="{game.tos?.color ?? ''} uno-card">
            <p>
                {game.tos?.value ?? ""}
            </p>
        </div>

    </div>


</div>
-->

<style>
    .link:visited {
        background-color: blue;
    }

    .game {
        display: flex;
        gap: 1em;
        align-items: center;
    }

    .players {
        flex: 1;
    }

    ul {
        list-style: none;
        padding: 0;
        display: flex;
        gap: 5px;
    }

    .draw{
        padding: 1em;
        border-radius: 0.5em;
        background-color: #252525;
        color: white;
        cursor: pointer;
    }

    .deal{
        display: flex;
        gap: 1em;
        align-items: center;
        flex-direction: column;

    }

    .player{
        padding: 1em;
        border-radius: 0.5em;

    }

    .blue {
        background-color: #1ca8f3;
    }

    .red {
        background-color: #ff4141;
    }

    .green {
        background-color: #3dc23d;
    }

    .yellow {
        background-color: #efbf0a;
    }

    .black {
        background-color: #252525;
    }

    .uno-card {
        position: relative;
        padding: 0.5em;
        aspect-ratio: 3/4;
        width: 3em;
        height: 4em;
        border-radius: 0.5em;
        display: grid;
        place-items: center;
        color: white;
    }

    .active-player{
        background-color: deepskyblue;
    }
</style>