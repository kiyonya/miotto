<template>
    <div class="artist">
        <div class="head" v-if="artistDetail">
            <DropShadowImg :src="$imgrsz(artistDetail?.cover, 500)" :round="true" class="cover"></DropShadowImg>
            <div class="artist-info">
                <div class="name">{{ artistDetail.name }}</div>
                <div class="detail">
                    <span>{{ artistDetail.musicSize }}单曲</span>
                    <span>{{ artistDetail.ablumSize }}专辑</span>
                    <span>{{ artistDetail.mvSize }}音乐视频</span>
                </div>
                <div class="desc">{{ artistDetail.briefDesc }}</div>
            </div>
        </div>

        <div class="hotsongs" v-if="artistHotSongs">
            <div class="title">热门歌曲</div>
            <div class="songs-grid">

                <SongMiniCard v-for="song in artistHotSongs.slice(0, 12)" :song="song" @click="playArtistSong(song)"
                    :class="{ playing: playStore.isPlaying(song) }"></SongMiniCard>

            </div>
        </div>

        <div class="albums" v-if="artistAlbums">
            <div class="title">歌手专辑</div>
            <div class="albums-grid">

                <AlbumCard v-for="album in artistAlbums.slice(0, 8)" :album="album"></AlbumCard>
            </div>
        </div>

        <div class="simi" v-if="artistSimi">
            <div class="title">与 {{ artistDetail?.name }} 相似的歌手</div>
            <div class="imgs">
                <img :src="artist.avatar" alt="" class="avatar" v-for="artist in artistSimi.slice(0, 8)" @click.stop="$router.push({name:'ArtistNcm',params:{id:artist.id}})">
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import AlbumCard from '@renderer/components/AlbumCard.vue';
import DropShadowImg from '@renderer/components/DropShadowImg.vue';
import SongMiniCard from '@renderer/components/SongMiniCard.vue';
import { usePlayerStore } from '@renderer/store/player';
import { song2TrackId } from '@renderer/utils/quickplay';
import { AppTypes } from 'src/types/app';
import { getCurrentInstance, onMounted, ref } from 'vue';
const props = defineProps<{
    id: number
}>()

const player = getCurrentInstance()?.appContext.config.globalProperties.$player

const playStore = usePlayerStore()

const artistDetail = ref<AppTypes.IArtist | null>( null)
const artistHotSongs = ref<AppTypes.ISong[] | null>(null)
const artistAlbums = ref<AppTypes.IAlbum[] | null>(null)
const artistSimi = ref<AppTypes.IArtist[] | null>(null)

async function load() {
    const artistId = props.id
    artistDetail.value = await window.ncmapi.artistDetail(artistId)
    artistHotSongs.value = await window.ncmapi.artistHotSong(artistId)
    artistAlbums.value = await window.ncmapi.artistAlbum(artistId, 20, 0)
    artistSimi.value = await window.ncmapi.artistSimi(artistId)
}


onMounted(() => {
    load()
})

onMounted(()=>{
    artistAlbums.value = null
    artistHotSongs.value = null
    artistAlbums.value = null
    artistSimi.value = null
})

function playArtistSong(song: AppTypes.ISong) {
    const trackIdList = artistHotSongs.value?.map(song2TrackId)
    const start = song2TrackId(song)
    if (trackIdList) {
        player?.playTrackList(trackIdList, start)
    }
    else {
        player?.playTrack(start)
    }
}


</script>

<style scoped>
.artist {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-x: hidden;
    height: fit-content;
}

.head {
    display: flex;
    gap: 1rem;

    .cover {
        width: 12rem;
        height: 12rem;
        flex-shrink: 0;
    }


    .artist-info {
        display: flex;
        flex-direction: column;


        .detail {
            display: flex;
            gap: 0.5rem;
            color: var(--text-2);
            font-size: 0.9rem;
        }

        .name {
            font-size: 2.9rem;
            font-weight: 500;
            width: 100%;
        }

        .desc {


            margin-top: 1rem;
            color: var(--text-3);
            font-size: 0.85rem;
            display: -webkit-box;
            -webkit-line-clamp: 5;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    }
}

.hotsongs,
.albums {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: fit-content;
    gap: 0.3rem;

    .title {
        font-size: 1.3rem;
        font-weight: 500;
    }



    .songs-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(3, 1fr);
        height: 100%;
        width: 100%;
        gap: 0.5rem;
    }
}

.albums-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 0.5rem;
    overflow: hidden;
}

.playing {
    background-color: var(--hover);
    outline: 1px solid var(--accent);
    outline-offset: -1px;
}

.simi {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 2rem;
    gap: 0.5rem;

    .title {
        font-size: 1.3rem;
        font-weight: 500;
    }

    .imgs {
        display: flex;
        gap: 0.5rem;
    }

    .avatar {
        width: 2.6rem;
        height: 2.6rem;
        object-fit: cover;
        border-radius: 50%;
        cursor: pointer;
    }
}
</style>