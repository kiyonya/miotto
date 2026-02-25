<template>
    <Teleport to="body">
        <Transition name="tcm" mode="default">
            <div class="context-menu" :style="menuStyle" ref="menuRef" v-if="visible">
                <template v-for="(item) in props.items">
                    <template v-if="item.split">
                        <div class="split" v-if="item.split">
                        </div>
                    </template>
                    <template v-else>
                        <div class="item" @click="handleItemClick(item)" :title="item.overTip"
                            :class="{ 'disabled': item.disabled }">
                            <Icon v-if="item.icon" :icon="item.icon" class="icon"></Icon>
                            <span>{{ item.label }}</span>
                        </div>
                    </template>
                </template>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';


interface ContextMenuItems {
    label?: string,
    icon?: string,
    overTip?: string,
    split?: boolean,
    onClick?: () => void,
    disabled?: boolean
}

const props = defineProps<{
    x: number,
    y: number,
    items: ContextMenuItems[]
}>()

const menuRef = ref<HTMLDivElement>()
const menuWidth = ref(0)
const menuHeight = ref(0)
const adjustedX = ref(0)
const adjustedY = ref(0)
const visible = ref(false)

const menuStyle = computed(() => {
    return {
        left: adjustedX.value + 'px',
        top: adjustedY.value + 'px'
    }
})

const handleItemClick = (item: ContextMenuItems) => {
    if (item.disabled) { return }
    if (item.onClick) {
        item.onClick()
    }
}

const adjustPosition = () => {
    if (!menuRef.value) return
    const rect = menuRef.value.getBoundingClientRect()
    menuWidth.value = rect.width
    menuHeight.value = rect.height
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    let newX = props.x
    let newY = props.y
    if (newX + menuWidth.value > viewportWidth) {
        newX = props.x - menuWidth.value
        if (newX < 0) {
            newX = viewportWidth - menuWidth.value - 10
        }
    }
    if (newY + menuHeight.value > viewportHeight) {
        newY = props.y - menuHeight.value
        if (newY < 0) {
            newY = viewportHeight - menuHeight.value - 10
        }
    }
    newX = Math.max(10, Math.min(newX, viewportWidth - menuWidth.value - 10))
    newY = Math.max(10, Math.min(newY, viewportHeight - menuHeight.value - 10))

    adjustedX.value = newX
    adjustedY.value = newY
}

const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    }
}

onMounted(() => {
    visible.value = true
    setTimeout(() => {
        adjustPosition()
        menuRef.value!.style.visibility = 'visible'
    }, 0)
    window.addEventListener('resize', adjustPosition)
    document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
    window.removeEventListener('resize', adjustPosition)
    document.removeEventListener('mousedown', handleClickOutside)
})

</script>

<style scoped>
.context-menu {
    position: fixed;
    background: var(--component);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-md);
    color: var(--text-1);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 0.3rem;
    border-radius: var(--br-2);
    gap: 0.3rem;
    visibility: hidden;
}

.split {
    width: 100%;
    height: 1px;
    border: none;
    background: var(--border);
    margin: 0;
}

.item {
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
    padding: 0.4rem 0.6rem;
    min-width: 9rem;
    height: fit-content;
    display: flex;
    align-items: center;
    border-radius: var(--br-1);
    font-size: 0.85rem;
    gap: 0.3rem;
    cursor: pointer;

    .icon {
        font-size: 0.9rem;
    }
}

.item:hover {
    background-color: var(--hover);
}


.context-menu::before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border: 6px solid transparent;
}

.disabled {
    filter: brightness(0.5);
    cursor: not-allowed !important;
}

.disabled:hover {
    background: none;
}

.tcm-enter-active,
.tcm-leave-active {
    transition: opacity 0.1s;
}

.tcm-enter-from,
.tcm-leave-to {
    opacity: 0;
}

.tcm-enter-to,
.tcm-leave-from {
    opacity: 1;
}
</style>