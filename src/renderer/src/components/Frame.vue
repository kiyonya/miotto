<template>
    <div class="frame">
        <button class="back" @click="$router.back" style="background: var(--component);">
            <Icon icon="fluent:arrow-left-12-regular" />
        </button>
        <div class="search">
            <form @submit="handleSearchSubmit">
                <input type="text" class="search-inpt" placeholder="搜索内容以继续" v-model="searchKeyword" @focus="onSearchInputFocus" @click.stop>
            </form>
            <button><Icon icon="fluent:search-20-filled" /></button>
            <button @click="showAudioRecognize"><Icon icon="fluent:fingerprint-20-regular" /></button>
        </div>
        <div class="system">
            <button @click.stop="configStore.toggleAppTheme">
                <Icon icon="fluent:brightness-low-24-regular" v-if="theme==='dark'"/>
                <Icon icon="fluent:weather-moon-24-regular" v-else/>
            </button>
            <button @click.stop="minimize"><Icon icon="fluent:minimize-24-regular" /></button>
            <button @click.stop="maximize"><Icon icon="fluent:maximize-16-regular" /></button>
            <button @click.stop="close"><Icon icon="fluent:add-24-regular" style="rotate: 45deg;" /></button>
        </div>
        <Transition name="search-match">
            <SearchMatch :keyword="searchKeyword" v-if="showSearchMatchTab" @close="handleSearchTabClose"></SearchMatch>
        </Transition>
        <Transition name="search-match">
            <AudioRcg v-if="showAudioRcg"></AudioRcg>
        </Transition>
    </div>
</template>
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import useConfigStore from '@renderer/store/config';
import { computed, ref } from 'vue';
import SearchMatch from './SearchMatch.vue';
import AudioRcg from './audiomatch/AudioRcg.vue';
const configStore = useConfigStore()
const theme = computed(()=>configStore.appTheme)
const showSearchMatchTab = ref<boolean>(false)
const showAudioRcg = ref<boolean>(false)
function minimize(){
    window.appapi.minimize()
}
function maximize(){
    window.appapi.maximize()
}
function close(){
    window.appapi.close()
}
const searchKeyword = ref<string>('')
function handleSearchSubmit(event:SubmitEvent){
    event.preventDefault()
    console.log(searchKeyword.value)
}
function onSearchInputFocus(){
    showSearchMatchTab.value = true
    window.addEventListener('click',handleSearchTabClose)
}
function handleSearchTabClose(){
    console.log('close')
    showSearchMatchTab.value = false
    window.removeEventListener('click',handleSearchTabClose)
}
function showAudioRecognize(){
    showAudioRcg.value = !showAudioRcg.value
}
</script>
<style scoped>
.frame{
    height:3.4rem;
    width: 100%;
    display: flex;
    -webkit-app-region: drag;
    box-sizing: border-box;
    padding: 0 1rem;
    align-items: center;
    gap: 0.5rem;
    position: relative;
}
.system{
    margin-left: auto;
    display: flex;
    gap: 0.5rem;
}
.search{
    display: inline-flex;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
    height: fit-content;

    .search-inpt{
        -webkit-app-region: no-drag;
        width: 14rem;
        height: 100%;
        background: none;
        color: var(--text-1);
        border: none;
        outline: none;
        background: var(--component);
        font-size: 0.9rem;
        box-sizing: border-box;
        padding: 0.45rem 0.6rem;
         border-radius: var(--br-2);
    }

}
button{
        -webkit-app-region: no-drag;
        aspect-ratio: 1/1;
        width: fit-content;
        height: fit-content;
        font-size: 1.5rem;
        padding: 0.3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        color: var(--text);
        border-radius: var(--br-2);
        cursor: pointer;
    }

    button:hover{
        background: var(--hover);
    }

.search-match-enter-active,.search-match-leave-active{
    transition: .2s;
}
.search-match-enter-from,.search-match-leave-to{
    transform: scaleY(0);
}
.search-match-enter-to,.search-match-leave-from{
    transform: scaleY(1);
}
</style>