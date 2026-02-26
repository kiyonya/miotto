<template>
    <Window>
        创建一个MINI Player项目
        <br>
        <button @click="selectProjectPath">选择项目位置</button>
        <br>
        {{ projectDir }}
        <br>
        请输入项目名称
        <input type="text" v-model="projectName">
        <br>
        请输入你开发的端口
        <input type="text" name="" v-model="devPort">
        <br>
        <button @click="create">创建项目</button>

        <br>
        <hr>
        运行你的项目
        <button @click="selectManifest">选择manifest.json</button>
        {{ projectManifest }}
        <br>
        <input type="checkbox" name="" id="" @change="handleDevChecker">
        <span>以开发模式运行</span>
        <br>
        <button @click="run">运行</button>

    </Window>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import Window from './Window.vue';
const projectDir = ref<string>('')
const devPort = ref<number>(3000)
const projectName = ref<string>('')

const projectManifest = ref<string>('')
const runOnDev = ref<boolean>(false)

async function selectProjectPath() {
    const value = await window.appapi.showOpenDialog({
        properties: ['createDirectory', 'openDirectory']
    })
    if (!value.canceled) {
        projectDir.value = value.filePaths[0]
    }
}
async function create() {
    if (!projectDir.value || !projectName.value) {
        alert('信息不全')
        return
    }
    await window.electron.ipcRenderer.invoke('plugin:createPluginProject', projectDir.value, projectName.value, Number(devPort.value))
}
async function selectManifest() {
    const value = await window.appapi.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Project Manifest', extensions: ['json'] }
        ]
    })
    if (!value.canceled && value.filePaths.length) {
        projectManifest.value = value.filePaths[0]
    }
}
function handleDevChecker(event: Event) {
    //@ts-ignore
    runOnDev.value = event.target.checked
}
async function run() {
    if (!projectManifest.value) { return }
    await window.electron.ipcRenderer.invoke('plugin:runPluginProject', projectManifest.value, runOnDev.value)
}
</script>