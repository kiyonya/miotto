<template>
    <div class="result">
        <div class="title">{{ keyword }}的搜索结果</div>
        
        <div class="group songs">
            <div class="subtitle">单曲</div>
            <div class="song-grid">
                <SongMiniCard :song="song" v-for="song in complexResult?.songs.slice(0,12)" @play="handleSongsPlay"></SongMiniCard>
            </div>
        </div>

        <div class="group playlists">
            <div class="subtitle">歌单</div>
            <div class="playlist-grid">
                <PlaylistCard :playlist="playlist" v-for="playlist in complexResult?.playlists.slice(0,4)"></PlaylistCard>
            </div>
        </div>

        <div class="group albums">
            <div class="subtitle">专辑</div>
            <div class="album-grid">
                <AlbumCard :album="album" v-for="album in complexResult?.albums.slice(0,4)"></AlbumCard>
            </div>
        </div>
        
    </div>
</template>
<script lang="ts" setup>
import AlbumCard from '@renderer/components/AlbumCard.vue';
import PlaylistCard from '@renderer/components/PlaylistCard.vue';
import SongMiniCard from '@renderer/components/SongMiniCard.vue';
import { song2TrackId } from '@renderer/utils/quickplay';
import { AppTypes } from 'src/types/app';
import { onBeforeMount, onMounted, ref } from 'vue';


const props = defineProps<{
    keyword:string
}>()
const keyword = ref<string>('')
const complexResult = ref<AppTypes.ISearchComplex>()

onBeforeMount(()=>{
    const decodeKeyword = decodeURIComponent((props.keyword))
    keyword.value = decodeKeyword
    window.ncmapi.searchResultComplex(keyword.value).then(data=>complexResult.value=data)
})


function handleSongsPlay(startSong:AppTypes.ISong){
    const list = complexResult.value?.songs || []
    const ids = list.map(song2TrackId)
    const id = song2TrackId(startSong)
    window.$player.playTrackList(ids,id)
}

</script>
<style scoped>
.result{
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
}
.title{
    font-size: 1.4rem;
    font-weight: 500;
}
.group{
    display: flex;
    flex-direction: column;
    width: 100%;
    height: fit-content;
    gap: 0.5rem;

    .subtitle{
        font-size: 1.35rem;
        font-weight: 500;
    }
}
.song-grid{
    display: grid;
    grid-template-columns: repeat(3,1fr);
    grid-template-rows: auto;
    width: 100%;
    gap: 0.5rem;
}
.playlist-grid{
    display: grid;
    width: 100%;
    grid-template-columns: repeat(4,1fr);
    grid-template-rows: auto;
    gap: 1rem;
}
.album-grid{
    display: grid;
    width: 100%;
    grid-template-columns: repeat(4,1fr);
    grid-template-rows: auto;
    gap: 1rem;
}

</style>