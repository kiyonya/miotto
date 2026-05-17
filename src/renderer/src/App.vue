<script setup lang="ts">
import Frame from './components/Frame.vue';
import MusicPlayer from './components/musicplayer/MusicPlayer.vue';
import Side from './components/side/Side.vue';
import SidePlaylist from './components/SidePlaylist.vue';
import Tray from './components/Tray.vue';
import { useAppStore } from './store/app';
import useConfigStore from './store/config';


const configStore = useConfigStore()
function changeTheme() {
  configStore.toggleAppTheme()
}

const appStore = useAppStore()

</script>

<template>

  <div class="main">
    <Side></Side>
    <div class="view">
      <Frame></Frame>
      <div class="rrc">

        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="$route.fullPath" class="page" />
          </keep-alive>
        </router-view>
      </div>
    </div>
  </div>
  <Tray></Tray>

  <Transition name="musicplayer">
    <MusicPlayer v-if="appStore.showMusicPlayer"></MusicPlayer>
  </Transition>

  <Transition name="sideplaylist">
    <SidePlaylist v-if="appStore.showSidePlaylist"></SidePlaylist>
  </Transition>

  <Transition name="maskfade">
    <div class="mask" v-if="appStore.showSidePlaylist"></div>
  </Transition>
</template>
<style scoped>
.musicplayer-enter-active,
.musicplayer-leave-active {
  transition: .5s;
}

.musicplayer-enter-from,
.musicplayer-leave-to {
  transform: translateY(100%);
}

.musicplayer-enter-to,
.musicplayer-leave-from {
  transform: translateY(0);
}

.sideplaylist-enter-active,
.sideplaylist-leave-active {
  transition: .3s;
}

.sideplaylist-enter-from,
.sideplaylist-leave-to {
  transform: translateX(100%);
}

.sideplaylist-enter-to,
.sideplaylist-leave-from {
  transform: translateX(0);
}

.maskfade-enter-active,
.maskfade-leave-active {
  transition: .3s;
}

.maskfade-enter-from,
.maskfade-leave-to {
  opacity: 0;
}

.maskfade-enter-to,
.maskfade-leave-from {
  opacity: 1;
}

.view {
  overflow-y: hidden;
}

.rrc {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.mask {
  width: 100vw;
  height: 100vh;
  z-index: 400;
  position: fixed;
  left: 0;
  top: 0;
  backdrop-filter: blur(2px) brightness(0.75);
}
</style>