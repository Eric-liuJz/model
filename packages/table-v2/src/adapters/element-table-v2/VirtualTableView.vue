<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'
import { ElAutoResizer, ElTableV2 } from 'element-plus'
import type { Column } from 'element-plus'
import { useTableContext } from '../../core/context'

interface VirtualRowWrapper<T> {
  __starTableKey: string | number
  __starTableRaw: T
}

const table = useTableContext<T>()
const wrapperCache = new WeakMap<T, VirtualRowWrapper<T>>()

function isVirtualRowWrapper<T>(row: T | VirtualRowWrapper<T>): row is VirtualRowWrapper<T> {
  return typeof row === 'object' && row !== null && '__starTableRaw' in row
}

function toVirtualRow(row: T): T | VirtualRowWrapper<T> {
  if (typeof table.rowKey !== 'function') return row

  const cached = wrapperCache.get(row)
  if (cached) {
    cached.__starTableKey = table.getRowId(row)
    cached.__starTableRaw = row
    return cached
  }

  const wrapped: VirtualRowWrapper<T> = {
    __starTableKey: table.getRowId(row),
    __starTableRaw: row
  }
  wrapperCache.set(row, wrapped)
  return wrapped
}

function getRawRow(row: T | VirtualRowWrapper<T>) {
  return isVirtualRowWrapper(row) ? row.__starTableRaw : row
}

const rows = computed(() => table.rows.value.map((row) => toVirtualRow(row)))
const rowKeyField = computed(() =>
  typeof table.rowKey === 'function' ? '__starTableKey' : (table.rowKey as string | number | symbol)
)

function resolveWidth(width?: number | string, minWidth?: number | string) {
  // el-table-v2 要求 width 最终是 number，这里把 schema 里的宽度配置统一归一化。
  if (typeof width === 'number') return width
  if (typeof width === 'string') return parseInt(width, 10) || 150
  if (typeof minWidth === 'number') return minWidth
  if (typeof minWidth === 'string') return parseInt(minWidth, 10) || 150
  return 150
}

const columns = computed<Column<any>[]>(
  () =>
    // 虚拟表格 adapter 只做“协议翻译”：
    // 把 controller 产出的 ResolvedColumn 映射成 el-table-v2 可消费的列定义。
    table.columns.value
      .filter((column) => !['selection', 'expand'].includes(column.kind))
      .map((column, index) => ({
        key: column.key,
        dataKey: column.key,
        title: column.title,
        width: resolveWidth(column.width, column.minWidth),
        fixed:
          column.fixed === 'left' ? true : column.fixed === 'right' ? ('right' as any) : undefined,
        sortable: !!column.sortable,
        align: column.align ?? 'left',
        headerCellRenderer: () => column.renderHeaderContent(index),
        cellRenderer: ({
          rowData,
          rowIndex
        }: {
          rowData: T | VirtualRowWrapper<T>
          rowIndex: number
        }) => column.renderCellContent(getRawRow(rowData), rowIndex)
      })) as Column<any>[]
)
</script>

<template>
  <div class="star-table-v2-virtual-view">
    <el-auto-resizer>
      <template #default="{ height, width }">
        <el-table-v2
          :columns="columns"
          :data="rows"
          :row-key="rowKeyField"
          :width="width"
          :height="height"
          fixed
          @sort-change="(payload: any) => table.actions.setSort(payload)"
          @column-sort="(payload: any) => table.actions.setSort(payload)"
        />
      </template>
    </el-auto-resizer>
  </div>
</template>
