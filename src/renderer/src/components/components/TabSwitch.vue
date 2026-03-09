<template>
    <div class="switch" ref="switchEl">
        <div class="item __item__" v-for="(item, i) in props.items" @click="handleClick(i, item)" :class="{selected:i === focusLabelIndex}">{{ item.label }}</div>
        <div class="backdrop" :style="{ width: backdropPosition.w + 'px', left: backdropPosition.x + 'px' }"></div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface TabItem {
    label:string,
    value:any,
    onClick?: (label: string) => void;
}
const focusLabelIndex = ref<number>(0)
const currentValue = ref<any | null>(null)
const props = defineProps<{
    items: TabItem[],
    start?: number,
    modelValue?: string,
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const switchEl = ref<HTMLElement | null>(null)

const backdropPosition = ref({
    x: 0,
    w: 0
})

function focusIndex(index: number = 0) {
    if (switchEl.value) {
        const items = Array.from(switchEl.value?.querySelectorAll('.__item__') || [])
        const itemTarget = items[index] as HTMLElement
        if (!itemTarget) { return }
        const x = itemTarget.offsetLeft
        const w = itemTarget.clientWidth
        backdropPosition.value.x = x
        backdropPosition.value.w = w
    }
}

function handleClick(index: number, item: TabItem) {
    if (currentValue.value === item.value) { return }
    currentValue.value = item.value
    focusLabelIndex.value = index
    focusIndex(index)
    if (item.onClick) {
        item.onClick(item.label)
    }
    emits('update:modelValue',item.value)
}

onMounted(() => {
    if(props.modelValue){
        const item = props.items.find(i=>i.value === props.modelValue)
        if(item){
           const i =  props.items.indexOf(item)
           focusLabelIndex.value = i
           focusIndex(i)
        }
    }
    else{
        focusLabelIndex.value = 0
        focusIndex()
    }
})

</script>
<style scoped>
.switch {
    display: flex;
    flex-direction: row;
    position: relative;
    height: fit-content;
    width: fit-content;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
    border-radius: var(--br-1);
    align-items: center;

    .item {
        font-size: 0.9rem;
        color: var(--text);
        opacity: 0.8;
        z-index: 12;
        box-sizing: border-box;
        padding: 0.2rem 0.4rem;
        cursor: pointer;
        transition: .1s;
        text-align: center;
    }

    .backdrop {
        position: absolute;
        height: 100%;
        left: 0;
        top: 0;
        background: rgba(255, 255, 255, 0.15);
        transition: .3s;
        z-index: 11;
        border-radius: var(--br-1);
    }

    .selected{
        opacity: 1;
    }
}
</style>