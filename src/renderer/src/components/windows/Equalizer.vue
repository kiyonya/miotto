<template>
    <Window :title="'滤波均衡器'" :width="'32rem'" :mask="true">
        <div class="equalizer">
            {{ enalbe }}
            <div class="gains">
                <div class="slider" v-for="(item,index) in equalizer">
                    <span class="gain">{{ item.g }}</span>
                    <vue-slider :direction="'btt'" class="slider-item" v-model="configStore.equalizerGains[index]" :min="-10" :max="10" :tooltip="'none'" :process-style="{'background':'var(--accent)'}"/>
                    <span class="freq">{{formatHz( item.f )}}</span>
                </div>
            </div>
        </div>
    </Window>
</template>
<script setup lang="ts">
import useConfigStore from '@renderer/store/config';
import Window from './Window.vue';
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'
import { computed } from 'vue';
const configStore = useConfigStore()
configStore.enableEqualizer = true
interface IE {
    f:number,
    g:number,
    i:number,
}
const equalizer = computed(()=>{
    const gains = configStore.equalizerGains
    const frequencies = configStore.equalizerFrequencies
    const vc:IE[] = []
    for(let i = 0;i < frequencies.length;i++){
        vc.push({
            f:frequencies[i],
            g:gains[i],
            i:i
        })
    }
    return vc
})
const enalbe = computed(()=>configStore.enableEqualizer)
function formatHz(f:number){
    if(f>=1000){
        return Math.floor(f / 1000) + 'kHz'
    }
    return f + 'Hz'
}
</script>
<style scoped>
.gains{
    display: grid;
    grid-template-columns: repeat(10,3rem);
    justify-content: center;

    .slider{
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        gap: 0.2rem;

        .slider-item{
            height: 10rem !important;

            .vue-slider-process{
                background: red !important;
            }
        }

        .freq{
            font-size: 0.85rem;
            color: var(--text-2);
        }

        .gain{
            font-size: 0.85rem;
            color: var(--text-2);
        }
    }
}

</style>