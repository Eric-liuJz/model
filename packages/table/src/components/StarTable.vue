<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, defineComponent } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import type { ColumnConfig } from '../types/column'
import type { PaginationConfig } from '../types/pagination'
import { resolveRenderer } from './renderer'
import StarPagination from './StarPagination.vue'

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
  columns: ColumnConfig<T>[]
  /** 表格数据源 */
  data: T[]
  /** 行数据主键 */
  rowKey?: string
  /** 是否开启分页，或传入具体分页配置对象 */
  pagination?: boolean | PaginationConfig
  /** 数据总条数（分页使用） */
  total?: number
}>()

// 分页双向绑定
const currentPage = defineModel<number>('currentPage', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 20 })

const emit = defineEmits<{
  (e: 'sort-change', payload: any): void
  (e: 'selection-change', selection: any[]): void
  (e: 'filter-change', filters: Record<string, any[]>): void
  (e: 'action', event: string, row: any, index: number): void
  (e: 'pagination-change'): void
}>()

/** 分离特殊功能列与普通数据列 */
const selectionColumn = computed(() => props.columns.find((col) => col.type === 'selection'))
const expandColumn = computed(() => props.columns.find((col) => col.type === 'expand'))

const dataColumns = computed(() =>
  props.columns.filter((col) => col.type !== 'selection' && col.type !== 'expand')
)

/**
 * 专门用于挂载直接返回 VNode 的定制渲染器（防止内联包裹函数导致的重新挂载闪烁）
 */
const StarVNodeRenderer = defineComponent({
  props: ['vnode'],
  render() {
    return this.vnode
  }
})
</script>

<template>
  <el-table
    :data="data"
    :row-key="rowKey"
    border
    @sort-change="(val: any) => emit('sort-change', val)"
    @selection-change="(val: any[]) => emit('selection-change', val)"
    @filter-change="(filters: any) => emit('filter-change', filters)"
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
        <div class="star-table-expand-wrapper">
          <slot name="expand" :row="row" :index="$index" />
        </div>
      </template>
    </el-table-column>

    <!-- 数据列：遍历渲染 -->
    <el-table-column
      v-for="col in dataColumns"
      :key="String(col.prop)"
      :type="['selection', 'index'].includes(col.type as string) ? col.type : undefined"
      :prop="String(col.prop)"
      :label="col.label"
      :width="col.width"
      :min-width="col.minWidth"
      :fixed="col.fixed || false"
      :align="col.align"
      :sortable="col.sortable || false"
      :show-overflow-tooltip="col.showOverflowTooltip"
      :class-name="col.className"
      :filters="col.filters"
      :filter-multiple="col.filterMultiple ?? true"
      :filter-placement="col.filterPlacement"
      :column-key="String(col.prop)"
    >
      <!-- 表头区域 -->
      <template #header>
        <StarVNodeRenderer
          v-if="col.renderHeader"
          :vnode="col.renderHeader!(col, dataColumns.indexOf(col))"
        />
        <template v-else>
          <span>{{ col.label }}</span>
          <el-tooltip
            v-if="col.headerTooltip"
            :content="
              typeof col.headerTooltip === 'string' ? col.headerTooltip : col.headerTooltip.content
            "
            :placement="
              typeof col.headerTooltip === 'object' ? (col.headerTooltip.placement ?? 'top') : 'top'
            "
          >
            <el-icon style="margin-left: 4px; cursor: help; vertical-align: middle">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </template>
      </template>

      <!-- 单元格内容区域 -->
      <template #default="{ row, $index }">
        <!-- 优先级 1：具名插槽优先 (基于 prop) -->
        <slot v-if="$slots[String(col.prop)]" :name="String(col.prop)" :row="row" :index="$index" />
        <!-- 优先级 2：renderCell 高阶自定义 -->
        <StarVNodeRenderer v-else-if="col.renderCell" :vnode="col.renderCell!(row, $index)" />
        <!-- 优先级 3：特定类型工厂渲染 (如 action 派发事件) -->
        <component
          v-else-if="col.type === 'action'"
          :is="resolveRenderer('action')"
          :row="row"
          :index="$index"
          :options="col.typeOptions"
          @action="(event: string, r: any, i: number) => emit('action', event, r, i)"
        />
        <!-- 优先级 4：通用工厂渲染 -->
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

  <!-- 底部统一分页栏 (原子组件接管) -->
  <StarPagination
    v-if="pagination"
    :config="pagination"
    :total="total ?? 0"
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    @change="() => emit('pagination-change')"
  />
</template>
