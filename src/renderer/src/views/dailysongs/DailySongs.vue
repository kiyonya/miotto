<template>
    <div class="dailysongs">
        <div class="tracks">
            <Song  v-for="(song,index) in dailySongs" :song="song" :key="song.id" @contextmenu="onSongContextMenu($event,song)" :index="index" @click="handleTrackPlay(song)"></Song>
        </div>
    </div>
</template>
<script setup lang="ts">
import { AppTypes } from 'src/types/app';
import { onBeforeMount, ref } from 'vue';
import Song from '@renderer/components/Song.vue';
import FunctionalWindows from '@renderer/components/windows';
import { song2TrackId } from '@renderer/utils/dataformat';

const dailySongs = ref<AppTypes.INCMSong[]>([])
onBeforeMount(()=>{
    window.ncmapi.recommendSongs().then(songs=>dailySongs.value = songs)
})


function onSongContextMenu(event:MouseEvent,song:AppTypes.INCMSong){
    console.log(song)

    FunctionalWindows.showContextMenu({
        x:event.x,
        y:event.y,
        items:[
            {label:'播放',onClick:()=>{},icon:'fluent:play-12-filled'},
            {label:'下一首播放',onClick:()=>{},icon:'fluent:text-bullet-list-add-24-filled'},
            {label:'添加到自定义歌单',onClick:()=>{},icon:'fluent:text-column-one-wide-20-regular'},
            {split:true},
            {label:'在浏览器打开',onClick:()=>{},icon:'fluent:open-in-browser-24-regular'},
            {label:'推送给云音乐应用',onClick:()=>{
                const id = song.id
                window.orpheusapi.playSong(id)
            },icon:'fluent:live-20-filled'},
        ]
    }).withFocus(event.target as HTMLElement)
}

function handleTrackPlay(song:AppTypes.ISong){
    const trackIds = dailySongs.value.map(song2TrackId)
    window.$player.playTrackList(trackIds,song2TrackId(song))
}

</script>
<style scoped>
.tracks{
    width: 100%;
    display: flex;
    flex-direction: column;
     --album-offset: calc(50% - 30px);
    --duration-offset: calc(100% - 50px);
}
.song {
    height: 3.5rem;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
    box-sizing: border-box;
    padding: 0.4rem;
    border-radius: var(--br-1);
    cursor: pointer;
    columns: 4;
    position: relative;

    .song-cover {
        height: 100%;
        aspect-ratio: 1/1;
        object-fit: cover;
        border-radius: var(--br-1);
    }

    .song-detail {
        display: flex;
        flex-direction: column;

        .name {
            font-size: 1rem;
            color: var(--text-1);
            max-width: 18rem;
        }

        .artist {
            font-size: 0.9rem;
            color: var(--text-3);
        }
    }

    .album {
        position: absolute;
        left: var(--album-offset);
        font-size: 0.85rem;
        color: var(--text-3);
        max-width: 18rem;
    }

    .typetip{
        margin-left: auto;
        margin-right: 3.6rem;
    }

    .duration {
        position: absolute;
        left: var(--duration-offset);
        font-size: 0.85rem;
        color: var(--text-3);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
}

.song:hover {
    background: var(--hover);
}


</style>