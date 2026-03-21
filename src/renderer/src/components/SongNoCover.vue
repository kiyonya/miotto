<template>
    <div class="song-nocover" @click="handlePlay" :style="{animationDelay:`${(index || 0)*0.05}s`}">
        <span v-if="index !== undefined" class="ser">{{ index }}</span>
        <div class="song-info">
            <div class="name single-line">{{ song.name }}</div>
            <ArtistName :artists="song.artists"></ArtistName>
        </div>
        <div class="duration">
            {{ $fmtsecond(song.duration) }}
        </div>
        <button class="escp" @click.stop>
            <Icon icon='fluent:more-16-filled'></Icon>
        </button>
    </div>
</template>

<script setup lang="ts">
import { AppTypes } from 'src/types/app';
import { Icon } from '@iconify/vue';
import ArtistName from './ArtistName.vue';
const props = defineProps<{ song: AppTypes.ISong,index?:number }>()
const emits = defineEmits<{
    play:[song:AppTypes.ISong]
}>()
function handlePlay(){
    emits('play',props.song)
}
</script>

<style scoped>
@keyframes flow-enter {
    to{
        opacity: 1;
        transform: translateY(0px);
    }
}

.song-nocover{
    display: flex;
    flex-direction: row;
    width: 100%;
    min-width: 0;
    flex-shrink: 0;
    align-items: center;
    position: relative;
    gap:1rem;
     box-sizing: border-box;
    padding: 0.3rem 0.6rem;
    border-radius: var(--br-1);
    transition: .2s;
    cursor: pointer;


    animation: flow-enter forwards .2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    opacity: 0;
    transform: translateY(20px);


    .ser{
        font-size: 0.9rem;
        color: var(--text-2);
    }

    .song-info{
        display: flex;
        flex-direction: column;

        .name{
           max-width: 18rem;
            font-size: 1rem;
            color: var(--text-1);

        }
    }

    .duration{
        margin-left: auto;
        font-size: 0.9rem;
        font-weight: 400;
        color: var(--text-3);
    }

    .escp{
        border: none;
        background: none;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.3rem;
        font-size: 0.9rem;
        color: var(--text-1);
        border-radius: var(--br-1);
    }

    .escp:hover{
        background: var(--hover);
        color: var(--accent);
    }
}

.song-nocover:hover{
    background: var(--hover);
   
}

</style>