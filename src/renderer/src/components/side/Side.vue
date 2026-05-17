<template>
    <div class="side">

        <div class="side-left">

            <div class="user" v-if="isLogin">
                <img :src="profile?.avatarUrl" alt="" class="avatar">
            </div>

            <div class="side-routes">
                <RouterLink :to="{ name: 'Home' }" class="link" active-class="link-active">
                    <Icon icon="fluent:home-28-regular" />
                </RouterLink>
                <RouterLink :to="{ name: 'Config' }" class="link" active-class="link-active">
                    <Icon icon="fluent:settings-24-regular" />
                </RouterLink>
            </div>
        </div>

        <div class="side-right">
            <PlayerSide></PlayerSide>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import { useProfileStore } from '@renderer/store/profile';
import { computed } from 'vue';
import PlayerSide from './PlayerSide.vue';

const profileStore = useProfileStore()
const isLogin = computed(() => profileStore.isLogin)
const profile = computed(()=>profileStore.profile)
</script>
<style scoped>
.side {
    width: var(--side-width, 32%);
    height: 100%;

    background: var(--component);
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-shrink: 0;
    

    .side-left{
        height: 100%;
        width: 3.5rem;
        flex-shrink: 0;
        overflow: hidden;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 0.4rem;
        background: var(--component-dark);

        .user{
            width: 100%;
            aspect-ratio: 1/1;

            .avatar{
                width: 100%;
                aspect-ratio: 1/1;
                border-radius: var(--br-1);
                object-fit: cover;
            }
        }
    }

    .side-routes{
        display: flex;
        flex-direction: column;
        color: var(--text);
        
        .link{
            color: var(--text);
            text-decoration: none;
            font-size: 2rem;
        }
    }

    .side-right{
        flex: 1;
        height: 100%;
    }
}
</style>