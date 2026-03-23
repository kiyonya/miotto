<template>
    <div class="artist-name">
        <RouterLink class="ar single-line" :to="{name:'ArtistNcm',params:{id:artist.id}}" v-for="artist in artists" @click.stop="handleRouterLinkClick" >{{ artist.name }}</RouterLink>
    </div>
</template>

<script setup lang="ts">
import { AppTypes } from 'src/types/app';
import { computed } from 'vue';

interface ArtistTag {
    platform:'ncm' | 'bili' | 'unk',
    name:string,
    id:number
}

const emits = defineEmits<{
    routerJump:[]
}>()

const props = defineProps<{
    artists:AppTypes.IArtistBrief | AppTypes.IArtist | AppTypes.IArtistBrief[] | AppTypes.IArtist[]
}>()

const artists = computed<ArtistTag[]>(()=>{
    let artists = Array.isArray(props.artists) ? props.artists : [props.artists]
    const rs:ArtistTag[] = []
    for(const ar of artists){
        const r:ArtistTag = {
            name:ar.name,
            platform:ar.platform,
            id:ar.id
        }
        rs.push(r)
    }
    return rs
})

function handleRouterLinkClick(){
    emits('routerJump')
}

</script>
<style scoped>
.artist-name{
    display: flex;
    gap: 0.15rem;
    max-width: 15rem;
    overflow: hidden;
}
.ar{
    color: var(--text-3);
    font-size: 0.85rem;
    text-decoration: none;
}
.ar:hover{
    text-decoration: underline;
}

</style>