import { computed, toValue } from 'vue'
import type {
  CreateRemoteStarTableOptions,
  CreateStarTableOptions,
  TableController
} from '../types'
import { createColumnRuntime } from './createColumnRuntime'
import { createRemoteDataFeature } from './createRemoteDataFeature'
import { createActionChannel } from './events'
import { createColumnSettingsFeature } from '../features/column-settings/model'
import { exportTableToXlsx } from '../features/export/model'
import { createPaginationFeature, sanitizePositiveInt } from '../features/pagination/model'
import { createSelectionFeature } from '../features/selection/model'
import { createSortingFeature } from '../features/sorting/model'
import type { TableColumn } from '../types'

const DEFAULT_VIEW_OPTIONS = {
  mode: 'table' as const,
  fill: true,
  minHeight: 320,
  loadingText: '加载中'
}

function compareValues(left: unknown, right: unknown) {
  if (left == null && right == null) return 0
  if (left == null) return -1
  if (right == null) return 1
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right))
}

function isRemoteOptions<T>(
  options: CreateStarTableOptions<T>
): options is CreateRemoteStarTableOptions<T> {
  return typeof (options as CreateRemoteStarTableOptions<T>).getData === 'function'
}

function resolveViewOptions(view: CreateStarTableOptions<unknown>['view']) {
  if (!view || typeof view === 'string') {
    return {
      ...DEFAULT_VIEW_OPTIONS,
      mode: view ?? DEFAULT_VIEW_OPTIONS.mode
    } as const
  }

  return {
    mode: view.mode ?? DEFAULT_VIEW_OPTIONS.mode,
    fill: view.fill ?? DEFAULT_VIEW_OPTIONS.fill,
    minHeight: view.minHeight ?? DEFAULT_VIEW_OPTIONS.minHeight,
    loadingText: view.loadingText ?? DEFAULT_VIEW_OPTIONS.loadingText
  } as const
}

function assertUniqueColumnKeys<T>(columns: TableColumn<T>[]) {
  const seen = new Set<string>()

  columns.forEach((column) => {
    if (seen.has(column.key)) {
      throw new Error(
        `[star-table-v2] Duplicate column key "${column.key}" detected. Every column key must be unique.`
      )
    }

    seen.add(column.key)
  })
}

export function createStarTable<T>(options: CreateStarTableOptions<T>): TableController<T> {
  assertUniqueColumnKeys(options.columns)
  const viewOptions = resolveViewOptions(options.view)

  const rowKey = options.rowKey
  const getRowId = (row: T) =>
    typeof rowKey === 'function'
      ? rowKey(row)
      : ((row as T & Record<PropertyKey, unknown>)[rowKey] as string | number)

  const remoteMode = isRemoteOptions(options)

  // 本地模式直接消费外部数据源；远程模式则由 controller 维护最近一次请求结果。
  const localRowsInput = computed<T[]>(() => (remoteMode ? [] : (toValue(options.data) as T[])))
  const remoteFeature = remoteMode ? createRemoteDataFeature(options) : undefined
  const paginationCanClamp = computed(() => !remoteMode || !!remoteFeature?.hasLoadedFlag.value)

  const sorting = createSortingFeature(options.features?.sorting)
  const hasPaginationFeature = !!options.features?.pagination
  const exportConfig =
    typeof options.features?.export === 'object' ? options.features.export : undefined
  const exportState = options.features?.export
    ? {
        enabled: true,
        scope: exportConfig?.scope ?? 'all',
        available: !remoteMode || !hasPaginationFeature || exportConfig?.scope === 'current'
      }
    : undefined
  const totalSource = computed(() =>
    remoteMode ? (remoteFeature?.total.value ?? 0) : localRowsInput.value.length
  )
  const pagination = createPaginationFeature(
    totalSource,
    options.features?.pagination,
    paginationCanClamp
  )
  const columnSettings = createColumnSettingsFeature(
    options.columns,
    options.features?.columnSettings
  )
  const selection = createSelectionFeature(getRowId, options.features?.selection)
  const actionChannel = createActionChannel<T>()

  const columns = createColumnRuntime({
    columns: options.columns,
    columnSettings,
    pagination,
    emitAction: actionChannel.emit
  })

  const requestPage = computed(() => pagination?.currentPage.value ?? 1)
  const requestPageSize = computed(() => pagination?.pageSize.value ?? 20)
  const requestSort = computed(() => ({
    key: sorting?.key.value ?? null,
    order: sorting?.order.value ?? null
  }))

  if (remoteFeature) {
    remoteFeature.bindAutoLoad({
      requestPage,
      requestPageSize,
      requestSort,
      currentPage: pagination?.currentPage
    })
  }

  // 排序属于 controller 的派生能力，而不是 adapter 的职责。
  // 本地模式在这里做排序；远程模式则把排序意图交给 getData。
  const allRows = computed<T[]>(() => {
    if (remoteMode) return remoteFeature?.rows.value ?? []

    const rows = [...localRowsInput.value]
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
    if (remoteMode) return remoteFeature?.rows.value ?? []
    if (!pagination) return allRows.value

    const start = (pagination.currentPage.value - 1) * pagination.pageSize.value
    return allRows.value.slice(start, start + pagination.pageSize.value)
  })

  const controller: TableController<T> = {
    view: {
      mode: viewOptions.mode,
      isVirtual: viewOptions.mode === 'virtual',
      fill: viewOptions.fill,
      minHeight: viewOptions.minHeight,
      loadingText: viewOptions.loadingText
    },
    rowKey,
    getRowId,
    schema: options.columns,
    data: computed(() => (remoteMode ? (remoteFeature?.rows.value ?? []) : localRowsInput.value)),
    allRows,
    rows,
    columns,
    state: {
      pagination,
      columnSettings,
      export: exportState,
      selection,
      sorting,
      remote: remoteFeature?.state
    },
    actions: {
      setPage(page) {
        if (!pagination) return
        pagination.currentPage.value = sanitizePositiveInt(page, 1)
      },
      setPageSize(pageSize) {
        if (!pagination) return
        pagination.pageSize.value = sanitizePositiveInt(pageSize, pagination.pageSize.value)
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
      async reload() {
        await remoteFeature?.load(true)
      },
      exportXlsx() {
        if (!exportState?.enabled || !exportState.available) return

        const exportRows = remoteMode ? (remoteFeature?.rows.value ?? []) : allRows.value
        exportTableToXlsx(columns.value, exportRows, exportConfig)
      }
    },
    onAction(handler) {
      return actionChannel.on(handler)
    }
  }

  return controller
}
