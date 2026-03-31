<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, h, useSlots } from 'vue'
import { ElAutoResizer, ElTableV2 } from 'element-plus'
import type { Column } from 'element-plus'
import type { ColumnConfig } from '../types/column'
import type { PaginationConfig } from '../types/pagination'
import { resolveRenderer } from './renderer'
import StarPagination from './StarPagination.vue'

/**
 * StarVirtualTable —— 高性能虚拟滚动表格。
 *
 * 设计原则：
 * - 与 StarTable 在物理上彻底隔离，不共享任何模板逻辑
 * - 重用相同的 ColumnConfig 协议和 Renderer Factory
 * - 通过桥接层将 ColumnConfig 映射为 el-table-v2 的 Column 规范
 * - 支撑 10万+ 级别数据的流畅渲染
 */

const props = defineProps<{
  /** 经 useTableCore 引擎计算后的可见列配置 */
  columns: ColumnConfig<T>[]
  /** 表格数据源 */
  data: T[]
  /** 行数据主键 */
  rowKey?: string
  /** 表格固定高度 (px)，传入后忽略 auto-resizer */
  height?: number
  /** 固定行高（默认 50px） */
  rowHeight?: number
  /** 预估行高（动态行高时使用） */
  estimatedRowHeight?: number
  /** 是否开启分页，或传入具体分页配置对象 */
  pagination?: boolean | PaginationConfig
  /** 数据总条数（分页使用） */
  total?: number
}>()

// 分页双向绑定
const currentPage = defineModel<number>('currentPage', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 20 })

const emit = defineEmits<{
  (e: 'action', event: string, row: any, index: number): void
  (e: 'sort-change', payload: any): void
  (e: 'pagination-change'): void
}>()

const slots = useSlots() as Record<string, ((...args: any[]) => any) | undefined>
const unsupportedTypes = new Set(['expand', 'selection'])
const warnedUnsupportedTypes = new Set<string>()

/**
 * 核心桥接层：将我们统一的 ColumnConfig 协议转换为 el-table-v2 的 Column 规范。
 *
 * el-table-v2 的 Column 需要:
 * - key: string         唯一标识
 * - dataKey: string      数据字段名
 * - title: string        表头文本
 * - width: number        列宽（必填）
 * - fixed?: true | 'left' | 'right'  固定
 * - cellRenderer?: fn    自定义单元格
 * - headerCellRenderer?: fn  自定义表头
 */
const v2Columns = computed<Column<any>[]>(() => {
  props.columns.forEach((col) => {
    const type = String(col.type ?? '')
    if (unsupportedTypes.has(type) && !warnedUnsupportedTypes.has(type)) {
      warnedUnsupportedTypes.add(type)
      console.warn(`[StarVirtualTable] Column type "${type}" is not supported and will be ignored.`)
    }
  })

  return props.columns
    .filter((col) => !unsupportedTypes.has(String(col.type ?? ''))) // v2 无 expand/selection 支持
    .map((col) => {
      const colKey = String(col.prop)
      const colDef: Column<any> = {
        key: colKey,
        dataKey: colKey,
        title: col.label ?? '',
        width: resolveWidth(col),
        align: col.align ?? 'left'
      }

      // 固定列
      if (col.fixed === 'left') colDef.fixed = true
      else if (col.fixed === 'right') colDef.fixed = 'right' as any

      // 排序
      if (col.sortable) colDef.sortable = true

      // 自定义表头渲染
      if (col.renderHeader) {
        colDef.headerCellRenderer = () => col.renderHeader!(col, 0)
      }

      // 单元格渲染桥接
      colDef.cellRenderer = buildCellRenderer(col)

      return colDef
    })
})

/**
 * 解析列宽为数字（el-table-v2 的 width 必须是数字类型）。
 */
function resolveWidth<T = any>(col: ColumnConfig<T>): number {
  if (col.type === 'selection') return 50
  if (col.type === 'index') return 60
  if (typeof col.width === 'number') return col.width
  if (typeof col.width === 'string') return parseInt(col.width, 10) || 150
  if (typeof col.minWidth === 'number') return col.minWidth
  if (typeof col.minWidth === 'string') return parseInt(col.minWidth, 10) || 150
  return 150 // 默认宽度
}

/**
 * 为每一列构建 cellRenderer 函数。
 * 这是整个桥接的核心——将我们标准化的 SFC 渲染器组件
 * 转化为 el-table-v2 要求的纯函数式 VNode 返回值。
 */
function buildCellRenderer<T = any>(col: ColumnConfig<T>) {
  const colKey = String(col.prop)
  const colType = col.type

  return ({ rowData, rowIndex }: { cellData: any; rowData: any; rowIndex: number }) => {
    // 优先级 1: 外部插槽覆盖
    if (slots[colKey]) {
      return slots[colKey]!({ row: rowData, index: rowIndex })
    }

    // 优先级 2: renderCell 函数式自定义
    if (col.renderCell) {
      return col.renderCell(rowData, rowIndex)
    }

    // 优先级 3: 操作列（需要特殊事件分发）
    if (colType === 'action') {
      const ActionComp = resolveRenderer('action')
      return h(ActionComp, {
        row: rowData,
        index: rowIndex,
        options: col.typeOptions,
        onAction: (event: string, row: any, index: number) => {
          emit('action', event, row, index)
        }
      })
    }

    // 优先级 4: 序号列
    if (colType === 'index') {
      return h('span', {}, rowIndex + 1)
    }

    // 优先级 5: 通用工厂渲染
    const CellComp = resolveRenderer(colType)
    return h(CellComp, {
      value: rowData[colKey],
      options: col.typeOptions,
      row: rowData
    })
  }
}

/** el-table-v2 的 rowKey 直接传字段名即可 */
const rowKeyField = computed(() => props.rowKey ?? 'id')
</script>

<template>
  <div class="star-virtual-table-wrapper">
    <el-auto-resizer>
      <template #default="{ height: autoHeight, width: autoWidth }">
        <el-table-v2
          :columns="v2Columns"
          :data="data"
          :row-key="rowKeyField"
          :width="autoWidth"
          :height="height ?? autoHeight"
          :row-height="rowHeight ?? 50"
          :estimated-row-height="estimatedRowHeight"
          fixed
          @column-sort="(payload: any) => emit('sort-change', payload)"
          @sort-change="(payload: any) => emit('sort-change', payload)"
        />
      </template>
    </el-auto-resizer>
  </div>

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
