<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from 'vue'
import { Setting, Rank, RefreshRight, Download } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import type { ColumnState } from '../types/column'

/**
 * 表格工具栏组件。
 *
 * 提供「列设置」抽屉面板，内置 SortableJS 拖拽排序能力，
 * 与 useTableCore 状态引擎无缝对接。
 */

defineProps<{
  /** 列瞬态属性的响应式数组引用（由 useTableCore.columnStates 传入） */
  columnStates: ColumnState[]
}>()

const emit = defineEmits<{
  /** 列可见性切换 */
  (e: 'toggle-visibility', prop: string, show: boolean): void
  /** 列固定方向变更 */
  (e: 'pin-column', prop: string, direction: 'left' | 'right' | false): void
  /** 列拖拽排序完成 */
  (e: 'reorder', oldIndex: number, newIndex: number): void
  /** 重置所有配置 */
  (e: 'reset'): void
  /** 刷新数据 */
  (e: 'refresh'): void
  /** 导出 Excel */
  (e: 'export'): void
}>()

const drawerVisible = ref(false)
const sortableListRef = ref<HTMLElement | null>(null)
let sortableInstance: Sortable | null = null

/**
 * 打开列设置抽屉并初始化拖拽实例
 */
const openDrawer = async () => {
  drawerVisible.value = true
  await nextTick()
  initSortable()
}

/**
 * 初始化 SortableJS 拖拽实例
 */
const initSortable = () => {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
  const el = sortableListRef.value
  if (!el) return

  sortableInstance = Sortable.create(el, {
    handle: '.drag-handle',
    animation: 200,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: (evt) => {
      const { oldIndex, newIndex } = evt
      if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
        emit('reorder', oldIndex, newIndex)
      }
    }
  })
}

/**
 * 切换列显隐
 */
const handleToggle = (prop: string, val: boolean | string | number) => {
  emit('toggle-visibility', prop, !!val)
}

/**
 * 切换列固定方向（循环: false -> left -> right -> false）
 */
const handlePin = (state: ColumnState) => {
  let next: 'left' | 'right' | false
  if (state.fixed === false) next = 'left'
  else if (state.fixed === 'left') next = 'right'
  else next = false
  emit('pin-column', state.prop, next)
}

/**
 * 获取固定方向显示文本
 */
const getPinLabel = (fixed: 'left' | 'right' | false): string => {
  if (fixed === 'left') return '左固定'
  if (fixed === 'right') return '右固定'
  return '不固定'
}

/**
 * 获取固定方向按钮类型
 */
const getPinType = (fixed: 'left' | 'right' | false) => {
  if (fixed === 'left') return 'primary'
  if (fixed === 'right') return 'warning'
  return 'info'
}

const handleReset = () => {
  emit('reset')
}

onBeforeUnmount(() => {
  if (sortableInstance) {
    sortableInstance.destroy()
  }
})
</script>

<template>
  <div class="star-table-toolbar">
    <div class="toolbar-actions">
      <slot name="left" />
    </div>
    <div class="toolbar-tools">
      <slot name="right" />
      <el-tooltip content="导出 Excel" placement="top">
        <el-button :icon="Download" circle size="small" @click="emit('export')" />
      </el-tooltip>
      <el-tooltip content="刷新" placement="top">
        <el-button :icon="RefreshRight" circle size="small" @click="emit('refresh')" />
      </el-tooltip>
      <el-tooltip content="列设置" placement="top">
        <el-button :icon="Setting" circle size="small" @click="openDrawer" />
      </el-tooltip>
    </div>
  </div>

  <el-drawer
    v-model="drawerVisible"
    title="列设置"
    direction="rtl"
    size="360px"
    :append-to-body="true"
  >
    <template #header>
      <div class="drawer-header">
        <span class="drawer-title">列设置</span>
        <el-button type="primary" link size="small" @click="handleReset"> 重置默认 </el-button>
      </div>
    </template>

    <div class="column-setting-list" ref="sortableListRef">
      <div
        v-for="state in columnStates"
        :key="state.prop"
        class="column-setting-item"
        :data-prop="state.prop"
      >
        <el-icon class="drag-handle"><Rank /></el-icon>
        <el-checkbox
          :model-value="state.show"
          @change="(val: boolean | string | number) => handleToggle(state.prop, val)"
          class="column-checkbox"
        >
          {{ state.prop }}
        </el-checkbox>
        <el-button
          size="small"
          :type="getPinType(state.fixed)"
          link
          @click="handlePin(state)"
          class="pin-btn"
        >
          {{ getPinLabel(state.fixed) }}
        </el-button>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="drawerVisible = false">关闭</el-button>
      </div>
    </template>
  </el-drawer>
</template>
