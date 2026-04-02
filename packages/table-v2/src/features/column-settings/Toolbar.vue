<script setup lang="ts">
import { Download, RefreshRight, Setting } from '@element-plus/icons-vue'
import { useTableContext } from '../../core/context'
import { useColumnSettingsToolbarViewModel } from './useColumnSettingsToolbarViewModel'

const table = useTableContext<any>()

defineEmits<{
  (e: 'refresh'): void
}>()
const {
  drawerVisible,
  states,
  exportState,
  visibleCount,
  sortableListRef,
  isSorting,
  fixedOptions
} = useColumnSettingsToolbarViewModel(table)
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
          v-if="exportState?.enabled && exportState.available"
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
    direction="rtl"
    size="420px"
    :append-to-body="true"
    class="star-table-column-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <div class="drawer-header-main">
          <span class="drawer-title">列设置</span>
          <p class="drawer-subtitle">勾选控制显示，拖拽调整顺序。</p>
        </div>
        <el-button type="primary" link size="small" @click="table.actions.resetColumns()">
          重置默认
        </el-button>
      </div>
    </template>

    <div class="column-setting-panel" :class="{ 'is-sorting': isSorting }">
      <div class="panel-summary">
        <span class="summary-label">已显示 {{ visibleCount }} / {{ states.length }} 列</span>
        <span class="summary-tip">修改即时生效</span>
      </div>

      <div ref="sortableListRef" class="column-setting-list">
        <div
          v-for="column in states"
          :key="column.key"
          class="column-setting-item"
          :class="{ 'is-hidden': !column.visible }"
        >
          <div class="item-main">
            <button type="button" class="drag-handle" aria-label="拖拽调整列顺序">
              <span class="drag-grip" aria-hidden="true" />
            </button>
            <el-checkbox
              :model-value="column.visible"
              class="column-checkbox"
              @change="
                (value: boolean | string | number) =>
                  table.actions.toggleColumnVisibility(column.key, !!value)
              "
            >
              <span class="column-title">{{ column.title }}</span>
            </el-checkbox>
          </div>

          <div class="column-actions">
            <el-select
              class="fixed-select"
              size="small"
              :model-value="column.fixed"
              @update:model-value="
                (value: 'left' | 'right' | false) => table.actions.pinColumn(column.key, value)
              "
            >
              <el-option
                v-for="option in fixedOptions"
                :key="String(option.value)"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>
