<template>
    <div class="side">
        <div class="user" v-if="profileStore.isLogin">
            <img :src="profileStore.profile?.avatarUrl" alt="" class="avatar">
            <div class="user-profile">
                <div class="name">{{ profileStore.profile?.nickname }}</div>
                <span class="sign">{{ profileStore.profile?.signature }}</span>
            </div>
            <Icon icon="tdesign:user" style="margin-left: auto;" />
        </div>
        <div class="user amon" v-else>

        </div>
        <div class="routes">
            <RouterLink :to="{name:'Home'}">
                首页
            </RouterLink>
            <RouterLink :to="{name:'Config'}">
                设置
            </RouterLink>
        </div>

        <button @click="openCreatePlaylist">创建</button>



        <div class="playlist-list">





            <template v-for="group in renderPlaylists">
                <div class="group">
                    <div class="title">
                        {{ group.name }}
                    </div>
                    <div class="playlists" v-if="!group.isWarp">
                        <RouterLink class="playlist" v-for="playlist in group.playlists" :class="playlist.type" :to="{name:playlist.type === 'custom' ? 'PlaylistCustom' : 'PlaylistNcm' ,params:{id:playlist.id}}">
                            <img :src="playlist.cover" alt="" class="cover">
                            <div class="playlist-info">
                                <div class="name">{{ playlist.name }}</div>
                            </div>
                        </RouterLink>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { useProfileStore } from '@renderer/store/profile';
import { Icon } from '@iconify/vue';
import { computed, onMounted, ref, watch } from 'vue';
import { AppTypes } from 'src/types/app';
import { usePlaylistStore } from '@renderer/store/playlist';
import FunctionalWindows from './windows';

interface PlaylistRenderInterface {
    name: string,
    isWarp: boolean, playlists: AppTypes.IPlaylistBrief[]
}

const playlistStore = usePlaylistStore()

const profileStore = useProfileStore()
const ncmCreatedPlaylists = ref<{
    name: string,
    playlists: AppTypes.IPlaylistBrief[]
}>({ name: '云音乐创建', playlists: [] })
const ncmCollectedPlaylists = ref<{
    name: string,
    playlists: AppTypes.IPlaylistBrief[]
}>({ name: '云音乐收藏', playlists: [] })
const userPlaylists = computed<{
    name: string,
    playlists: AppTypes.IPlaylistBrief[]
}>(()=>{
    return {
        name:'我的歌单',
        playlists:playlistStore.playlists
    }
})

const isLogin = computed(()=>profileStore.isLogin)


const renderPlaylists = computed<PlaylistRenderInterface[]>(() => {
    const seq = [userPlaylists,ncmCreatedPlaylists, ncmCollectedPlaylists]
    const renderData: PlaylistRenderInterface[] = []
    for (const group of seq) {
        if (group.value.playlists.length) {
            renderData.push({
                isWarp: false,
                name: group.value.name,
                playlists: group.value.playlists
            })
        }
    }
    return renderData
})

async function load() {
    const uid = profileStore.profile?.userId
    if (uid) {
        const playlistGroup = await window.ncmapi.userPlaylists(uid)
        ncmCollectedPlaylists.value.playlists = playlistGroup.collected
        ncmCreatedPlaylists.value.playlists = playlistGroup.created
    }
}
onMounted(() => {
    if (isLogin.value) {
        load()
    }
    else {
        const watchHandler = watch(isLogin, () => {
            if(isLogin.value){
                load()
                watchHandler.stop()
            }
        })
    }
})

async function openCreatePlaylist(){
    const playlistName = await FunctionalWindows.showCreatePlaylistWindow()
    if(playlistName){
        const id = await playlistStore.createPlaylist(playlistName)
        console.log(id)
    }
}
</script>
<style scoped>
.side {
    width: 22%;
    height: 100%;
    background: var(--component);
    box-sizing: border-box;
    padding: 1.2rem 0.7rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-shrink: 0;
}

.user {
    width: 100%;
    height: fit-content;
    display: flex;
    flex-direction: row;
    gap: 0.8rem;
    align-items: center;
    color: var(--text-1);
    background: var(--component-light);
    box-sizing: border-box;
    padding: 0.4rem 0.8rem;
    border-radius: var(--br-2);
    cursor: pointer;

    .user-profile {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .avatar {
        width: 2.3rem;
        height: 2.3rem;
        border-radius: 50%;
    }

    .name {
        color: var(--text-1);
        font-size: 1rem;
    }

    .sign {
        color: var(--text-3);
        font-size: 0.8rem;
    }
}

.user:hover {
    background: var(--hover);
}

.playlist-list {
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    overflow-y: auto;
    gap: 1rem;

    .group {
        width: 100%;

        .title {
            width: 100%;
            font-size: 0.85rem;
            color: var(--text-1);
            border-bottom: 1px solid var(--border);
            padding-bottom: 0.25rem;
            margin-bottom: 0.25rem;
        }
    }

    .playlists {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        flex-shrink: 0;


        .playlist {
            text-decoration: none;
            display: flex;
            align-items: center;
            color: var(--text-1);
            gap: 0.5rem;
            flex-shrink: 0;
            box-sizing: border-box;
            padding: 0.35rem;
            border-radius: 0 var(--br-1) var(--br-1) 0 ;
            cursor: pointer;
            transition: .2s;

            .cover {
                width: 2.4rem;
                height: 2.4rem;
                border-radius: var(--br-1);
                object-fit: cover;
            }

            .playlist-info {
                display: flex;
                flex-direction: column;
                height: fit-content;

                .name {
                    font-size: 0.85rem;
                    color: var(--text-1);
                }

                .count {
                    font-size: 0.85rem;
                    color: var(--text-3);
                }
            }
        }

        .playlist:hover {
            background: var(--hover);
            border-width: var(--br-1);
        }

        .ncm{
            border-left: solid rgb(221, 56, 56);
            border-width: 0;
        }
    }
}
</style>