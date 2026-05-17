<template>
    <div class="user">

        <div class="head">
            <div class="background">
                <img :src="profile?.backgroundUrl" alt="" class="bgimg">
            </div>
            <div class="user-info">
                <img  :src="profile?.avatarUrl" v-if="profile?.avatarUrl"  alt="" class="avatar">
                <div class="user-detail">
                    <div class="name">{{ profile?.nickname }}</div>
                    <div class="tags">
                        <span class="tag">{{ profile?.follows }} 关注</span>
                        <span class="tag">{{ profile?.followeds }} 粉丝</span>
                        <span class="tag">{{ profile?.gender }}</span>
                    </div>
                    <div class="bio">{{ profile?.signature }}</div>
                </div>
            </div>
        </div>


    </div>
</template>
<script setup lang="ts">
import { AppTypes } from 'src/types/app';
import { onBeforeMount, ref } from 'vue';

const props = defineProps < {
    uid: number | string
} > ()

const profile = ref < AppTypes.NCMTypes.IUserProfile > ()

async function loadUser(uid: number | string) {
    uid = Number(uid)
    const userProfile = await window.ncmapi.userProfile(uid)
    profile.value = userProfile
}

onBeforeMount(() => {
    loadUser(props.uid)
})
</script>
<style scoped>
.head{
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 12rem;
    overflow: visible;

    .background{
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 56%;
        z-index: 0;

        .bgimg{
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: var(--br-3);
        }
    }

    .user-info{
        display: flex;
        flex-direction: row;
        color: var(--text);
        z-index: 1;
        position: relative;
        margin-top: auto;
        margin-bottom: 0;
        gap: 1rem;
        box-sizing: border-box;
        padding: 0 1.5rem;

        .avatar{
            width: 8rem;
            height: 8rem;
            border-radius: 50%;
            border: 7px solid var(--component);
            box-sizing: border-box;
        }

        .user-detail{
            margin-top: auto;
            margin-bottom: 0;
            

            .name{
                font-size: 1.4rem;
                font-weight: 500;
            }

            .tags{
                display: flex;
                color: var(--text-3);
                font-size: 0.9rem;
                gap: 0.8rem;

            }

            .bio{
                margin-top: 0.5rem;
            }
        }
    }

}


</style>