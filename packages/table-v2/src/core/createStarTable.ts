import { computed, toValue } from 'vue'
import type { CreateStarTableOptions, TableController } from '../types'
import { createColumnRuntime } from './createColumnRuntime'
import { createActionChannel } from './events'
import { createColumnSettingsFeature } from '../features/column-settings/model'
import { exportTableToXlsx } from '../features/export/model'
import { createPaginationFeature } from '../features/pagination/model'
import { createSelectionFeature } from '../features/selection/model'
import { createSortingFeature } from '../features/sorting/model'

function compareValues(left: unknown, right: unknown) {
  if (left == null && right == null) return 0
  if (left == null) return -1
  if (right == null) return 1
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right))
}

export function createStarTable<T>(options: CreateStarTableOptions<T>): TableController<T> {
  const rowKey = options.rowKey
  const getRowId = (row: T) =>
    typeof rowKey === 'function'
      ? rowKey(row)
      : ((row as T & Record<PropertyKey, unknown>)[rowKey] as string | number)

  // v2 采用单一数据源设计：
  // controller 永远把外部传入的 data 视为事实来源，不在内部维护第二份可写副本。
  const allRowsInput = computed<T[]>(() => toValue(options.data) as T[])

  const pagination = createPaginationFeature(
    computed(() => allRowsInput.value.length),
    options.features?.pagination
  )
  const columnSettings = createColumnSettingsFeature(
    options.columns,
    options.features?.columnSettings
  )
  const sorting = createSortingFeature(options.features?.sorting)
  const selection = createSelectionFeature(getRowId, options.features?.selection)
  const actionChannel = createActionChannel<T>()

  const columns = createColumnRuntime({
    columns: options.columns,
    columnSettings,
    pagination,
    emitAction: actionChannel.emit
  })

  // 排序属于 controller 的派生能力，而不是 adapter 的职责。
  // 也就是说，UI 层只负责上报排序意图，真正的数据重排在这里统一完成。
  const allRows = computed<T[]>(() => {
    const rows = [...allRowsInput.value]
    const sortingKey = sorting?.key.value
    const sortingOrder = sorting?.order.value

    if (!sortingKey || !sortingOrder) return rows

    const column = columns.value.find((item) => item.key === sortingKey)
    if (!column || !('accessor' in column)) return rows

    return rows.sort((leftRow, rightRow) => {
      const leftValue = column.getValue(leftRow, 0)
      const rightValue = column.getValue(rightRow, 0)
      const result = compareValues(leftValue, rightValue)
      return sortingOrder === 'ascending' ? result : result * -1
    })
  })

  const rows = computed<T[]>(() => {
    if (!pagination) return allRows.value
    const start = (pagination.currentPage.value - 1) * pagination.pageSize.value
    return allRows.value.slice(start, start + pagination.pageSize.value)
  })

  const controller: TableController<T> = {
    view: {
      mode: options.view ?? 'table',
      isVirtual: (options.view ?? 'table') === 'virtual'
    },
    rowKey,
    getRowId,
    schema: options.columns,
    data: allRowsInput,
    allRows,
    rows,
    columns,
    state: {
      pagination,
      columnSettings,
      selection,
      sorting
    },
    actions: {
      setPage(page) {
        if (!pagination) return
        pagination.currentPage.value = Math.max(page, 1)
      },
      setPageSize(pageSize) {
        if (!pagination) return
        pagination.pageSize.value = pageSize
        pagination.currentPage.value = 1
      },
      toggleColumnVisibility(key, visible) {
        if (!columnSettings) return
        const column = columnSettings.columns.value.find((item) => item.key === key)
        if (column) column.visible = visible
      },
      pinColumn(key, fixed) {
        if (!columnSettings) return
        const column = columnSettings.columns.value.find((item) => item.key === key)
        if (column) column.fixed = fixed
      },
      reorderColumn(from, to) {
        if (!columnSettings) return
        const list = [...columnSettings.columns.value]
        const [moved] = list.splice(from, 1)
        if (!moved) return
        list.splice(to, 0, moved)
        columnSettings.columns.value = list
      },
      resetColumns() {
        if (!columnSettings) return
        columnSettings.columns.value = options.columns.map((column) => ({
          key: column.key,
          title: column.title ?? column.key,
          visible: column.visible ?? true,
          fixed: column.fixed ?? false
        }))
      },
      setSelection(nextRows) {
        if (!selection) return
        selection.rows.value = nextRows
      },
      clearSelection() {
        if (!selection) return
        selection.rows.value = []
      },
      setSort(payload) {
        if (!sorting) return
        sorting.key.value = payload.prop ?? payload.columnKey ?? null
        sorting.order.value = payload.order ?? null
      },
      exportXlsx() {
        if (!options.features?.export) return
        exportTableToXlsx(
          columns.value,
          allRows.value,
          typeof options.features.export === 'object' ? options.features.export : undefined
        )
      }
    },
    onAction(handler) {
      return actionChannel.on(handler)
    }
  }

  return controller
}
