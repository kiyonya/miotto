<template>
    <div class="search-match" @click.stop>
        <div class="first" v-if="!keywordRef">
            <div class="title">最近搜索</div>
        </div>
        <div class="search-suggest" v-if="keywordRef" :class="{loadingkey:loading}">
            <div class="loading" v-if="loading">
                <Icon icon="line-md:loading-twotone-loop" />
            </div>
            <div class="title" v-if="searchResult?.keywords.length">搜索建议</div>
            <RouterLink class="keyword" :to="{name:'SearchResult',params:{keyword:encodeURIComponent(k.keyword)}}" v-for="k in searchResult?.keywords" @click.stop="emits('close')">{{ k.keyword }}</RouterLink>
            <div class="title" style="margin-top: 0.5rem;" v-if="showDirect">可直达</div>
            <RouterLink v-for="playlist in searchResult?.playlists" :to="{ name: 'PlaylistNcm', params: { id: playlist.id } }"
                class="keyword" @click.stop="emits('close')">
                <span class="type">歌单</span>
                <span>{{ playlist.name }}</span>
            </RouterLink>
            <span class="song keyword" v-for="song in searchResult?.songs.slice(0, 2)">
                <span class="type">单曲</span>
                <span>{{ song.name }}</span>
            </span>
        </div>
        <div class="no-result" v-if="showNoMatchScreen && !loading">
            <Icon icon="fluent:border-none-16-regular" />
            <span>没有 {{ keywordRef }} 的搜索建议</span>
        </div>
        
    </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from 'vue';
import { debounce } from 'lodash';
import { AppTypes } from 'src/types/app';
import { Icon } from '@iconify/vue';

const props = defineProps<{
    keyword: string
}>()

const emits = defineEmits(['close'])

const keywordRef = toRef(props, 'keyword')
const loading = ref<boolean>(false)
const debouncedLoader = debounce(loadSearchMatch, 400)
const searchResult = ref<AppTypes.ISearchSuggest>()

const showDirect = computed<boolean>(() => {
    return Boolean(searchResult.value?.albums.length || searchResult.value?.playlists.length || searchResult.value?.songs.length)
})

const showNoMatchScreen = computed<boolean>(() => {
    return (!searchResult.value?.keywords.length && !showDirect.value && Boolean(keywordRef.value))
})

onMounted(() => {
    loadSearchMatch(keywordRef.value)
    watch(keywordRef, () => {
        debouncedLoader(keywordRef.value)
    })
})

async function loadSearchMatch(keyword: string) {
    if (loading.value) { return }
    if (!keyword) { return }
    loading.value = true
    searchResult.value = await window.ncmapi.searchSuggest(keyword)
    loading.value = false
}

</script>
<style scoped>
.search-match {
    width: 19.2rem;
    height: fit-content;
    background: var(--component);
    position: absolute;
    top: 3.4rem;
    z-index: 90;
    transform-origin: top center;
    border-radius: var(--br-2);
    box-shadow: var(--shadow-md);
    box-sizing: border-box;
    padding: 0.5rem;
    overflow-y: auto;
    max-height: 25rem;
    
}

.search-suggest {
    display: flex;
    flex-direction: column;
    color: var(--text-1);
    position: relative;

    .title {
        font-size: 0.8rem;
        color: var(--text-3);
        margin-bottom: 0.3rem;
    }

    .keyword {
        display: flex;
        flex-direction: row;
        color: var(--text-1);
        text-decoration: none;
        font-size: 0.9rem;
        gap: 0.5rem;
        align-items: center;

        box-sizing: border-box;
        padding: 0.3rem;
        border-radius: var(--br-1);
        cursor: pointer;

        transition: .1s;

    }

    .keyword:hover {
        background: var(--hover);
    }

    .type {
        font-size: 0.75rem;
        box-sizing: border-box;
        padding: 0.2rem 0.4rem;
        border-radius: 0.2rem;
        background: var(--hover);
        white-space: nowrap
    }

    .loading{
        width: 100%;
        height: 100%;
        text-align: center;
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

.loadingkey{
    .keyword{
        opacity: 0;
    }
}

.no-result{
    color: var(--text-1);
    display: flex;
    gap: 0.5rem;
    align-items: center;
}
</style>