import { computed, type Slots } from 'vue'
import type { TableController, TableViewStateSlotProps } from '../types'
import TableView from '../adapters/element-table/TableView.vue'
import VirtualTableView from '../adapters/element-table-v2/VirtualTableView.vue'

type ViewStateKind = 'loading' | 'error' | 'empty' | 'content'

interface TableViewState {
  kind: ViewStateKind
  presentation: TableViewStateSlotProps<any>['presentation']
}

const LOCAL_VIEW_STATE: TableViewState = {
  kind: 'content',
  presentation: 'inline'
}

const EMPTY_VIEW_STATE: TableViewState = {
  kind: 'empty',
  presentation: 'state'
}

function normalizeLength(value: number | string) {
  return typeof value === 'number' ? `${value}px` : value
}

function resolveViewState(
  hasRemote: boolean,
  loading: boolean,
  hasRows: boolean,
  hasError: boolean,
  isEmpty: boolean
): TableViewState {
  if (!hasRemote) {
    return LOCAL_VIEW_STATE
  }

  if (loading) {
    return {
      kind: 'loading',
      presentation: hasRows ? 'mask' : 'state'
    }
  }

  if (hasError) {
    return {
      kind: 'error',
      presentation: hasRows ? 'inline' : 'state'
    }
  }

  if (isEmpty) {
    return EMPTY_VIEW_STATE
  }

  return LOCAL_VIEW_STATE
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return '请求未能成功完成，请稍后再试。'
}

export function useStarTableViewModel<T>(table: TableController<T>, slots: Slots) {
  const currentView = computed(() => (table.view.isVirtual ? VirtualTableView : TableView))
  const remote = computed(() => table.state.remote)
  const loading = computed(() => remote.value?.loading.value ?? false)
  const hasLoaded = computed(() => remote.value?.hasLoaded.value ?? false)
  const isReloading = computed(() => remote.value?.isReloading.value ?? false)
  const isEmpty = computed(() => remote.value?.isEmpty.value ?? false)
  const error = computed(() => remote.value?.error.value ?? null)
  const hasRows = computed(() => table.rows.value.length > 0)
  const topbarVisible = computed(() => !!slots.leftTop || !!slots.rightTop)
  const footerVisible = computed(() => !!slots.footer)

  const viewState = computed<TableViewState>(() =>
    resolveViewState(!!remote.value, loading.value, hasRows.value, !!error.value, isEmpty.value)
  )

  const surfaceStyle = computed(() => ({
    minHeight: normalizeLength(table.view.minHeight),
    height: table.view.fill ? '100%' : undefined
  }))

  const sharedSlotProps = computed<TableViewStateSlotProps<T>>(() => ({
    table,
    remote: remote.value,
    status: (remote.value?.status.value ?? 'local') as TableViewStateSlotProps<T>['status'],
    loading: loading.value,
    hasLoaded: hasLoaded.value,
    hasRows: hasRows.value,
    isEmpty: isEmpty.value,
    isReloading: isReloading.value,
    error: error.value,
    presentation: viewState.value.presentation,
    reload: table.actions.reload
  }))

  const errorMessage = computed(() => resolveErrorMessage(error.value))

  return {
    currentView,
    topbarVisible,
    footerVisible,
    viewState,
    surfaceStyle,
    sharedSlotProps,
    errorMessage
  }
}
