<script setup lang="ts">
import { ref } from 'vue'
import { Setting, RefreshRight, Download } from '@element-plus/icons-vue'
import { useTableContext } from '../../core/context'

const table = useTableContext<any>()
defineEmits<{
  (e: 'refresh'): void
}>()
const drawerVisible = ref(false)

const states = table.state.columnSettings?.columns

function cycleFixed(current: 'left' | 'right' | false) {
  if (current === false) return 'left'
  if (current === 'left') return 'right'
  return false
}
</script>

<template>
  <div class="star-table-v2-toolbar">
    <div class="toolbar-left">
      <slot name="left" />
    </div>
    <div class="toolbar-right">
      <slot name="right" />
      <el-tooltip content="导出 Excel" placement="top">
        <el-button
          v-if="table.actions.exportXlsx"
          :icon="Download"
          circle
          size="small"
          @click="table.actions.exportXlsx()"
        />
      </el-tooltip>
      <el-tooltip content="刷新数据" placement="top">
        <el-button :icon="RefreshRight" circle size="small" @click="$emit('refresh')" />
      </el-tooltip>
      <el-tooltip content="列设置" placement="top">
        <el-button
          v-if="states"
          :icon="Setting"
          circle
          size="small"
          @click="drawerVisible = true"
        />
      </el-tooltip>
    </div>
  </div>

  <el-drawer
    v-if="states"
    v-model="drawerVisible"
    title="列设置"
    direction="rtl"
    size="360px"
    :append-to-body="true"
  >
    <template #header>
      <div class="drawer-header">
        <span class="drawer-title">列设置</span>
        <el-button type="primary" link size="small" @click="table.actions.resetColumns()">
          重置默认
        </el-button>
      </div>
    </template>

    <div class="column-setting-list">
      <div v-for="(column, index) in states" :key="column.key" class="column-setting-item">
        <el-checkbox
          :model-value="column.visible"
          @change="
            (value: boolean | string | number) =>
              table.actions.toggleColumnVisibility(column.key, !!value)
          "
        >
          {{ column.title }}
        </el-checkbox>
        <div class="column-actions">
          <el-button
            link
            size="small"
            @click="table.actions.pinColumn(column.key, cycleFixed(column.fixed))"
          >
            {{
              column.fixed === 'left' ? '左固定' : column.fixed === 'right' ? '右固定' : '不固定'
            }}
          </el-button>
          <el-button
            link
            size="small"
            :disabled="index === 0"
            @click="table.actions.reorderColumn(index, index - 1)"
          >
            上移
          </el-button>
          <el-button
            link
            size="small"
            :disabled="index === states.length - 1"
            @click="table.actions.reorderColumn(index, index + 1)"
          >
            下移
          </el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>
