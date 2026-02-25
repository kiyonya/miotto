<template>
    <Window :title="'从云音乐登录 Miotto'">
        <div class="login">

            <div class="qr">
                <div class="title">使用云音乐扫码登录</div>
                <div class="qrimg-area">
                    <img :src="qrimgSrc" alt="" class="qrimg" v-if="qrimgSrc">
                    <div class="timeout-mask">
                        <button class="refresh" @click="startLogin">刷新二维码</button>
                    </div>
                </div>
                <span class="msg">{{ loginMessage }}</span>
            </div>
            <div class="div"></div>
            <div class="desc">
                <span>我们不会收集您的任何个人信息，您的登陆凭证保存在您的本地</span>
                <span>你的每次请求将会携带您的凭证从云音乐服务器获取信息</span>
                <span>您可以随时清除您的登录凭证 [退出登录]</span>
            </div>
        </div>
    </Window>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import Window from './Window.vue';
import { useProfileStore } from '@renderer/store/profile';

const emits = defineEmits(['close'])

const qrimgSrc = ref<string>('')
const loginMessage = ref<string>('等待扫码')
const isQrTimeout = ref<boolean>(false)

let qrStatusInterval: NodeJS.Timeout | null = null

const profileStore = useProfileStore()

async function startLogin() {

    isQrTimeout.value = false

    const qrkey = await window.ncmapi.loginQrKey()
    const unikey = qrkey.data.unikey
    const qr = await window.ncmapi.loginQrCreate(unikey, true)
    const qrimg = qr.data.qrimg
    qrimgSrc.value = qrimg

    const loginAwaitPromise = new Promise<string>((resolve, reject) => {

        qrStatusInterval = setInterval(async () => {
            const status = await window.ncmapi.loginQrCheck(unikey)
            if (status.code === 800) {
                isQrTimeout.value = true
                loginMessage.value = '二维码已过期'
                if (qrStatusInterval) {
                    clearInterval(qrStatusInterval)
                }
                qrStatusInterval = null
                reject()
            }
            else if (status.code === 801) {
                loginMessage.value = '等待扫码'
            }
            else if (status.code === 802) {
                loginMessage.value = '等待确认'
            }
            else if (status.code === 803) {
                loginMessage.value = '授权登录成功'
                if (qrStatusInterval) {
                    clearInterval(qrStatusInterval)
                }
                qrStatusInterval = null
                resolve(status.cookie)
            }
        }, 1000);
    })

    await loginAwaitPromise

    const loginStatus = await window.ncmapi.loginStatusCheck()
    const profile = loginStatus.data.profile
    const account = loginStatus.data.account
    if (profile && !account.anonimousUser) {
        profileStore.setLoginStatus(true)
    }
    if (profile) {
        profileStore.setUserProfile(profile)
    }
    if (account) {
        profileStore.setUserAccount(account)
    }

    emits('close')
}

onMounted(() => {
    startLogin()
})

onUnmounted(() => {
    if (qrStatusInterval) {
        clearInterval(qrStatusInterval)
    }
    qrStatusInterval = null
})

</script>
<style scoped>
.login {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    gap: 1rem;
    align-items: center;
}

.desc {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    font-size: 0.9rem;
    color: var(--text-3);
    justify-content: center;
}

.div {
    width: 1px;
    height: 80%;
    background: var(--border);
}

.qr {
    height: 100%;
    width: fit-content;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .title {
        font-size: 1.1rem;
    }

    .qrimg-area {
        width: 10rem;
        height: 10rem;
        overflow: hidden;
        border-radius: var(--br-2);
        border: 1.5px solid var(--border);

        .qrimg {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .timeout-mask {
            width: 100%;
            height: 100%;
            backdrop-filter: brightness(0.6) blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;

            .refresh {
                background: none;
                border: none;
                color: white;
                font-size: 1rem;
            }
        }
    }

    .msg {
        width: 100%;
        text-align: center;
        color: var(--text-2);
        background: var(--component);
        border-radius: var(--br-2);
        box-sizing: border-box;
        padding: 0.3rem;
    }
}
</style>