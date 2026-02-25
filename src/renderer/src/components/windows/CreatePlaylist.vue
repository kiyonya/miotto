<template>
    <Window :title="'创建您的歌单'" :mask="true" :height="'14rem'" @close="handleCancel">
        <div class="create-playlist">
            <span class="title">为您的歌单命名</span>
            <input type="text" name="" id="" class="input" placeholder="输入歌单名" v-model="playlistName" :class="{focus:Boolean(message)}">
            <span v-if="message" style="color: var(--text-3);font-size: 0.85rem;">{{message }}</span>
            <div class="buttons">
                <button @click="handleCancel">取消</button>
                <button class="strong" @click="handleCreateClick">创建</button>
            </div>
        </div>
    </Window>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import Window from './Window.vue';
const emits = defineEmits(['close', 'create'])
const playlistName = ref<string>('')
let showMessageTimeout: NodeJS.Timeout | null = null
const message = ref<string>('')
function handleCreateClick() {
    if (playlistName.value) {
        emits('create', playlistName.value)
    }
    else {
        if (!showMessageTimeout) {
            message.value = '请输入歌单名称',
                showMessageTimeout = setTimeout(() => {
                    message.value = ''
                    showMessageTimeout = null
                }, 3000);
        }
    }
}
function handleCancel(){
    emits('close')
}


</script>
<style scoped>
.create-playlist {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: 100%;

    .title {
        font-size: 1rem;
        color: var(--text-2);
    }

    .input {
        width: 100%;
        font-size: 1rem;
        background: var(--component);
        border: none;
        outline:transparent 1px solid;
        color: var(--text-1);
        padding: 0.4rem 0.6rem;
        box-sizing: border-box;
        border-radius: var(--br-1);
        transition: .1s;
    }

    .focus{
        outline: 1px solid var(--accent);
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
}
</style>