<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'
import { useTableContext } from '../../core/context'
import { VNodeRenderer } from '../../core/VNodeRenderer'

const table = useTableContext<T>()
const rows = computed(() => table.rows.value)
const controllerSortingEnabled = computed(() => !!table.state.sorting?.enabled)

const expandColumn = computed(() => table.columns.value.find((column) => column.kind === 'expand'))
const selectionColumn = computed(() =>
  table.columns.value.find((column) => column.kind === 'selection')
)
const dataColumns = computed(() =>
  table.columns.value.filter((column) => !['expand', 'selection'].includes(column.kind))
)

function resolveSortable(
  sortable: boolean | 'custom' | undefined,
  sortingEnabled: boolean
): boolean | 'custom' {
  if (!sortable) return false
  return sortingEnabled ? 'custom' : sortable
}
</script>

<template>
  <el-table
    :data="rows"
    :row-key="typeof table.rowKey === 'function' ? (table.getRowId as any) : table.rowKey"
    border
    @selection-change="(rows: T[]) => table.actions.setSelection(rows)"
    @sort-change="table.actions.setSort"
  >
    <el-table-column
      v-if="selectionColumn"
      type="selection"
      :width="selectionColumn.width ?? 55"
      :fixed="selectionColumn.fixed || false"
    />

    <el-table-column
      v-if="expandColumn"
      type="expand"
      :width="expandColumn.width ?? 55"
      :fixed="expandColumn.fixed || false"
    >
      <template #default="{ row, $index }">
        <VNodeRenderer
          :content="expandColumn.renderExpand({ row, index: $index, column: expandColumn })"
        />
      </template>
    </el-table-column>

    <el-table-column
      v-for="(column, index) in dataColumns"
      :key="column.key"
      :prop="column.key"
      :label="column.title"
      :width="column.width"
      :min-width="column.minWidth"
      :fixed="column.fixed || false"
      :align="column.align"
      :sortable="resolveSortable(column.sortable, controllerSortingEnabled)"
      :class-name="column.className"
      :show-overflow-tooltip="column.kind === 'text' ? column.overflowTooltip : false"
      :column-key="column.key"
    >
      <template #header>
        <VNodeRenderer :content="column.renderHeaderContent(index)" />
      </template>
      <template #default="{ row, $index }">
        <VNodeRenderer :content="column.renderCellContent(row, $index)" />
      </template>
    </el-table-column>
  </el-table>
</template>
