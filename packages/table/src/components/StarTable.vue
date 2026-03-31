<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import type { ColumnConfig } from '../types/column'
import { resolveRenderer } from './renderer'

/**
 * StarTable 核心表格组件。
 *
 * 设计原则：
 * - 模板层只承担结构遍历与事件分发，不包含任何业务判断逻辑
 * - 单元格内容完全委托渲染工厂决策
 * - 操作列采用方案 C（配置驱动 + 插槽逃生）：有 #action 插槽时插槽优先，否则走 CellAction 配置
 */

const props = defineProps<{
  /** 经 useTableCore 引擎计算后的可见列配置 */
  columns: ColumnConfig[]
  /** 表格数据源 */
  data: any[]
  /** 行数据主键 */
  rowKey?: string
}>()

const emit = defineEmits<{
  (e: 'sort-change', payload: any): void
  (e: 'selection-change', selection: any[]): void
  (e: 'action', event: string, row: any, index: number): void
}>()

const slots = useSlots()

/** 分离特殊功能列与普通数据列 */
const selectionColumn = computed(() =>
  props.columns.find(col => col.type === 'selection')
)
const expandColumn = computed(() =>
  props.columns.find(col => col.type === 'expand')
)
const dataColumns = computed(() =>
  props.columns.filter(col => col.type !== 'selection' && col.type !== 'expand')
)
</script>

<template>
  <el-table
    :data="data"
    :row-key="rowKey"
    border
    @sort-change="(val: any) => emit('sort-change', val)"
    @selection-change="(val: any[]) => emit('selection-change', val)"
  >
    <!-- 勾选列 -->
    <el-table-column
      v-if="selectionColumn"
      type="selection"
      :width="selectionColumn.width ?? 55"
      :fixed="selectionColumn.fixed || false"
    />

    <!-- 展开列 -->
    <el-table-column
      v-if="expandColumn"
      type="expand"
      :width="expandColumn.width ?? 55"
      :fixed="expandColumn.fixed || false"
    >
      <template #default="{ row, $index }">
        <slot name="expand" :row="row" :index="$index" />
      </template>
    </el-table-column>

    <!-- 数据列：遍历渲染 -->
    <el-table-column
      v-for="col in dataColumns"
      :key="String(col.prop)"
      :prop="String(col.prop)"
      :label="col.label"
      :width="col.width"
      :min-width="col.minWidth"
      :fixed="col.fixed || false"
      :align="col.align"
      :sortable="col.sortable || false"
    >
      <!-- 表头区域 -->
      <template #header>
        <component
          v-if="col.renderHeader"
          :is="() => col.renderHeader!(col, dataColumns.indexOf(col))"
        />
        <template v-else>
          <span>{{ col.label }}</span>
          <el-tooltip
            v-if="col.headerTooltip"
            :content="typeof col.headerTooltip === 'string'
              ? col.headerTooltip
              : col.headerTooltip.content"
            :placement="typeof col.headerTooltip === 'object'
              ? col.headerTooltip.placement ?? 'top'
              : 'top'"
          >
            <el-icon style="margin-left: 4px; cursor: help; vertical-align: middle;">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </template>
      </template>

      <!-- 单元格内容区域 -->
      <template #default="{ row, $index }">
        <!-- 优先级 1：renderCell 高阶自定义 -->
        <component
          v-if="col.renderCell"
          :is="() => col.renderCell!(row, $index)"
        />
        <!-- 优先级 2：操作列 — 插槽逃生优先，无插槽则走 CellAction 配置驱动 -->
        <template v-else-if="col.type === 'action'">
          <slot
            v-if="slots.action"
            name="action"
            :row="row"
            :index="$index"
          />
          <component
            v-else
            :is="resolveRenderer('action')"
            :row="row"
            :index="$index"
            :options="col.typeOptions"
            @action="(event: string, r: any, i: number) => emit('action', event, r, i)"
          />
        </template>
        <!-- 优先级 3：工厂渲染 -->
        <component
          v-else
          :is="resolveRenderer(col.type)"
          :value="row[String(col.prop)]"
          :options="col.typeOptions"
          :row="row"
        />
      </template>
    </el-table-column>
  </el-table>
</template>
