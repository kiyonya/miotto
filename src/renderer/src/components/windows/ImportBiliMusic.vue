<template>
    <Window :title="'从BiliBili导入音频'" :mask="true" @close="handleCancel">
        <div class="import-bilimusic">
            <span class="tip">请输入BV号或链接</span>
            <div class="input-bv">
                <input type="text" v-model="bvOrUrl">
                <button @click="parseBV" class="parse">解析</button>
            </div>
            <span v-if="parsedSong" class="tip result">解析结果</span>
            <div class="parsed-bilisong" v-if="parsedSong">
                <img :src="parsedSong.cover" alt="" v-if="parsedSong.cover" class="cover">
                <div class="song-info">
                    <div class="name">{{ parsedSong.name }}</div>
                    <ArtistName :artists="parsedSong.artists"></ArtistName>
                </div>
            </div>
            <div class="buttons">
                <button @click="handleCancel">取消</button>
                <button class="strong" @click="handleImport" v-if="parsedSong">确认导入</button>
            </div>
        </div>
    </Window>

</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import Window from './Window.vue';
import { AppTypes } from 'src/types/app';
import ArtistName from '../ArtistName.vue';

const emits = defineEmits(['close', 'import'])

const bvInput = ref('')
const bvOrUrl = computed({
    set: (value: string) => {
        console.log('输入值:', value)
        try {
            if (/^BV[a-zA-Z0-9]{10}$/.test(value)) {
                bvInput.value = value
                return
            }
            const url = new URL(value)
            if (url.hostname.includes('bilibili.com')) {
                const match = value.match(/BV[a-zA-Z0-9]{10}/)
                if (match) {
                    bvInput.value = match[0]
                } else {
                    bvInput.value = value
                }
            }
        } catch (error) {
            bvInput.value = value
        }
    },
    get: () => {
        return bvInput.value
    }
})

const parsedSong = ref<AppTypes.IBiliSong | null>(null);
const isParsing = ref<boolean>(false)
async function parseBV() {
    if (!bvInput.value) {
        return
    }
    if (!/^BV[a-zA-Z0-9]{10}$/.test(bvInput.value)) {
        return
    }
    try {
        isParsing.value = true
        const song = await window.biliapi.songDetail(bvInput.value)
        isParsing.value = false
        if (song) {
            parsedSong.value = song
        }
    } catch (error) {
        isParsing.value = false
    }

}

function handleCancel() {
    emits('close')
}

function handleImport() {
    if (parsedSong.value && !isParsing.value) {
        emits('import', parsedSong.value)
    }
}
</script>
<style scoped>
.import-bilimusic {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .input-bv {
        width: 100%;
        display: flex;

        input {
            flex: 1;
            padding: 0.4rem 0.6rem;
            font-size: 1rem;
            background: var(--component);
            border: none;
            outline: transparent 1px solid;
            color: var(--text-1);
            border-radius: var(--br-1);
        }

        .parse {
            margin-left: 0.5rem;
            padding: 0.4rem 0.6rem;
            font-size: 1rem;
            background: var(--component-light);
            color: var(--text-1);
            border: none;
            outline: none;
            border-radius: var(--br-1);
            cursor: pointer;
        }
    }
}

.tip {
    font-size: 0.9rem;
    color: var(--text-3);
}

.result {
    margin-top: 0.5rem;
}

.parsed-bilisong {
    width: 100%;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    box-sizing: border-box;
    padding: 0.3rem;
    border-radius: var(--br-1);
    cursor: pointer;
    transition: .1;
    will-change: background;

    .cover {
        width: 5rem;
        height: 5rem;
        border-radius: var(--br-1);
        object-fit: cover;
    }
}

.parsed-bilisong:hover {
    background: var(--hover);
}

.buttons {
    display: flex;
    width: 100%;
    justify-content: end;
    gap: 0.8rem;
    margin-top: auto;

    button {
        color: var(--text-1);
        border: none;
        padding: 0.4rem 1rem;
        background: var(--component);
        border-radius: var(--br-1);
        font-size: 0.9rem;
        cursor: pointer;
    }

    button:hover {
        background: var(--hover);
    }

}
</style>