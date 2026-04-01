import { computed, ref, shallowRef, toValue, watch } from 'vue'
import type {
  CreateRemoteStarTableOptions,
  CreateStarTableOptions,
  TableController,
  TableGetDataParams,
  TableGetDataResult,
  TableRemoteLoadContext,
  RemoteLoadStatus
} from '../types'
import { createColumnRuntime } from './createColumnRuntime'
import { createActionChannel } from './events'
import { createColumnSettingsFeature } from '../features/column-settings/model'
import { exportTableToXlsx } from '../features/export/model'
import { createPaginationFeature } from '../features/pagination/model'
import { createSelectionFeature } from '../features/selection/model'
import { createSortingFeature } from '../features/sorting/model'
import type { TableColumn } from '../types'

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

async function invokeRemoteHook<Args extends unknown[]>(
  hook: ((...args: Args) => void | Promise<void>) | undefined,
  ...args: Args
) {
  if (!hook) return

  try {
    await hook(...args)
  } catch {
    // 生命周期钩子用于埋点、日志和外围联动，不应反向影响主请求结果。
  }
}

export function createStarTable<T>(options: CreateStarTableOptions<T>): TableController<T> {
  assertUniqueColumnKeys(options.columns)

  const rowKey = options.rowKey
  const getRowId = (row: T) =>
    typeof rowKey === 'function'
      ? rowKey(row)
      : ((row as T & Record<PropertyKey, unknown>)[rowKey] as string | number)

  const remoteMode = isRemoteOptions(options)

  // 本地模式直接消费外部数据源；远程模式则由 controller 维护最近一次请求结果。
  const localRowsInput = computed<T[]>(() => (remoteMode ? [] : (toValue(options.data) as T[])))
  const remoteRows = shallowRef<T[]>([])
  const remoteTotal = ref(0)
  const remoteLoading = ref(false)
  const remoteStatus = ref<RemoteLoadStatus>('idle')
  const remoteError = ref<unknown | null>(null)
  const remoteLastUpdatedAt = ref<number | null>(null)
  const remoteHasLoadedFlag = ref(false)
  const remoteQuery = computed<Record<string, unknown>>(() =>
    remoteMode ? { ...(toValue(options.query ?? {}) as Record<string, unknown>) } : {}
  )
  const remoteConfig = remoteMode ? (options.remote ?? {}) : undefined
  const paginationCanClamp = computed(() => !remoteMode || remoteHasLoadedFlag.value)

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
  const totalSource = computed(() => (remoteMode ? remoteTotal.value : localRowsInput.value.length))
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
  const querySignature = computed(() => JSON.stringify(remoteQuery.value))
  let requestSequence = 0

  const buildGetDataParams = (): TableGetDataParams => ({
    page: requestPage.value,
    pageSize: requestPageSize.value,
    sort: requestSort.value,
    query: remoteQuery.value
  })

  async function loadRemoteData(manual = false) {
    if (!remoteMode) return

    const currentRequest = ++requestSequence
    const params = buildGetDataParams()
    const keepPreviousData = remoteConfig?.keepPreviousData ?? true

    if (!keepPreviousData) {
      remoteRows.value = []
      remoteTotal.value = 0
    }

    remoteLoading.value = true
    remoteStatus.value = 'loading'
    remoteError.value = null

    let finalStatus: RemoteLoadStatus = 'loading'
    let finalResult: TableGetDataResult<T> | null = null
    let finalError: unknown | null = null
    let currentRequestFinished = false

    const markRequestFinished = () => {
      if (currentRequest !== requestSequence || currentRequestFinished) return false
      remoteLoading.value = false
      remoteHasLoadedFlag.value = true
      currentRequestFinished = true
      return true
    }

    try {
      await invokeRemoteHook(remoteConfig?.onBeforeLoad, params)
      const result = await options.getData(params)
      if (currentRequest !== requestSequence) return

      remoteRows.value = result.rows
      remoteTotal.value = result.total
      remoteLastUpdatedAt.value = Date.now()
      remoteStatus.value = 'success'
      finalStatus = 'success'
      finalResult = result

      const successContext: TableRemoteLoadContext<T> = {
        requestId: currentRequest,
        params,
        manual,
        status: 'success',
        result,
        error: null
      }

      markRequestFinished()
      await invokeRemoteHook(remoteConfig?.onLoadSuccess, result, params, successContext)
    } catch (error) {
      if (currentRequest !== requestSequence) return
      remoteError.value = error
      remoteStatus.value = 'error'
      finalStatus = 'error'
      finalError = error

      const errorContext: TableRemoteLoadContext<T> = {
        requestId: currentRequest,
        params,
        manual,
        status: 'error',
        result: null,
        error
      }

      markRequestFinished()
      await invokeRemoteHook(remoteConfig?.onLoadError, error, params, errorContext)
    } finally {
      markRequestFinished()

      if (currentRequest === requestSequence) {
        const finalContext: TableRemoteLoadContext<T> = {
          requestId: currentRequest,
          params,
          manual,
          status: finalStatus,
          result: finalResult,
          error: finalError
        }
        await invokeRemoteHook(remoteConfig?.onLoadFinally, finalContext)
      }
    }
  }

  if (remoteMode) {
    watch(
      querySignature,
      () => {
        if (pagination && pagination.currentPage.value !== 1) {
          pagination.currentPage.value = 1
        }
      },
      { flush: 'sync' }
    )

    watch(
      [
        requestPage,
        requestPageSize,
        () => requestSort.value.key,
        () => requestSort.value.order,
        querySignature
      ],
      () => {
        void loadRemoteData(false)
      },
      { immediate: remoteConfig?.immediate ?? true }
    )
  }

  // 排序属于 controller 的派生能力，而不是 adapter 的职责。
  // 本地模式在这里做排序；远程模式则把排序意图交给 getData。
  const allRows = computed<T[]>(() => {
    if (remoteMode) return remoteRows.value

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
    if (remoteMode) return remoteRows.value
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
    data: computed(() => (remoteMode ? remoteRows.value : localRowsInput.value)),
    allRows,
    rows,
    columns,
    state: {
      pagination,
      columnSettings,
      export: exportState,
      selection,
      sorting,
      remote: remoteMode
        ? {
            enabled: true,
            status: remoteStatus,
            loading: remoteLoading,
            error: remoteError,
            rows: remoteRows,
            total: remoteTotal,
            query: remoteQuery,
            lastUpdatedAt: remoteLastUpdatedAt,
            hasLoaded: computed(() => remoteHasLoadedFlag.value),
            isReloading: computed(() => remoteLoading.value && remoteHasLoadedFlag.value),
            isEmpty: computed(
              () =>
                remoteHasLoadedFlag.value &&
                !remoteLoading.value &&
                !remoteError.value &&
                remoteRows.value.length === 0
            ),
            immediate: remoteConfig?.immediate ?? true,
            keepPreviousData: remoteConfig?.keepPreviousData ?? true
          }
        : undefined
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
      async reload() {
        await loadRemoteData(true)
      },
      exportXlsx() {
        if (!exportState?.enabled || !exportState.available) return

        const exportRows = remoteMode ? remoteRows.value : allRows.value
        exportTableToXlsx(columns.value, exportRows, exportConfig)
      }
    },
    onAction(handler) {
      return actionChannel.on(handler)
    }
  }

  return controller
}
