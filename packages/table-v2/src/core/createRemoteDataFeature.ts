import { computed, ref, shallowRef, toValue, watch, type ComputedRef, type Ref } from 'vue'
import type {
  CreateRemoteStarTableOptions,
  RemoteDataFeatureState,
  RemoteLoadStatus,
  TableGetDataParams,
  TableGetDataResult,
  TableRemoteLoadContext,
  TableSortParams
} from '../types'
import { stableSerialize } from './stableSerialize'

export const DEFAULT_REMOTE_OPTIONS = {
  immediate: true,
  keepPreviousData: true
} as const

interface BindRemoteAutoLoadOptions {
  requestPage: ComputedRef<number>
  requestPageSize: ComputedRef<number>
  requestSort: ComputedRef<TableSortParams>
  currentPage?: Ref<number>
}

async function invokeRemoteHook<Args extends unknown[]>(
  hook: ((...args: Args) => void | Promise<void>) | undefined,
  ...args: Args
) {
  if (!hook) return

  try {
    await hook(...args)
  } catch {
    // 生命周期钩子只用于外围联动，不反向影响主请求结果。
  }
}

export function createRemoteDataFeature<T>(options: CreateRemoteStarTableOptions<T>) {
  const rows = shallowRef<T[]>([])
  const total = ref(0)
  const loading = ref(false)
  const status = ref<RemoteLoadStatus>('idle')
  const error = ref<unknown | null>(null)
  const lastUpdatedAt = ref<number | null>(null)
  const hasLoadedFlag = ref(false)
  const query = computed<Record<string, unknown>>(() => ({
    ...(toValue(options.query ?? {}) as Record<string, unknown>)
  }))
  const config = {
    ...DEFAULT_REMOTE_OPTIONS,
    ...(options.remote ?? {})
  }

  let requestSequence = 0
  let getCurrentParams: (() => TableGetDataParams) | null = null

  async function load(manual = false) {
    if (!getCurrentParams) return

    const currentRequest = ++requestSequence
    const params = getCurrentParams()

    if (!config.keepPreviousData) {
      rows.value = []
      total.value = 0
    }

    loading.value = true
    status.value = 'loading'
    error.value = null

    let finalStatus: RemoteLoadStatus = 'loading'
    let finalResult: TableGetDataResult<T> | null = null
    let finalError: unknown | null = null
    let currentRequestFinished = false

    const markRequestFinished = () => {
      if (currentRequest !== requestSequence || currentRequestFinished) return false
      loading.value = false
      hasLoadedFlag.value = true
      currentRequestFinished = true
      return true
    }

    try {
      await invokeRemoteHook(config.onBeforeLoad, params)
      const result = await options.getData(params)
      if (currentRequest !== requestSequence) return

      rows.value = result.rows
      total.value = result.total
      lastUpdatedAt.value = Date.now()
      status.value = 'success'
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
      await invokeRemoteHook(config.onLoadSuccess, result, params, successContext)
    } catch (requestError) {
      if (currentRequest !== requestSequence) return

      error.value = requestError
      status.value = 'error'
      finalStatus = 'error'
      finalError = requestError

      const errorContext: TableRemoteLoadContext<T> = {
        requestId: currentRequest,
        params,
        manual,
        status: 'error',
        result: null,
        error: requestError
      }

      markRequestFinished()
      await invokeRemoteHook(config.onLoadError, requestError, params, errorContext)
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
        await invokeRemoteHook(config.onLoadFinally, finalContext)
      }
    }
  }

  function bindAutoLoad({
    requestPage,
    requestPageSize,
    requestSort,
    currentPage
  }: BindRemoteAutoLoadOptions) {
    const querySignature = computed(() => stableSerialize(query.value))

    getCurrentParams = () => ({
      page: requestPage.value,
      pageSize: requestPageSize.value,
      sort: requestSort.value,
      query: query.value
    })

    watch(
      querySignature,
      () => {
        if (currentPage && currentPage.value !== 1) {
          currentPage.value = 1
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
        void load(false)
      },
      { immediate: config.immediate }
    )
  }

  const state: RemoteDataFeatureState<T> = {
    enabled: true,
    status,
    loading,
    error,
    rows,
    total,
    query,
    lastUpdatedAt,
    hasLoaded: computed(() => hasLoadedFlag.value),
    isReloading: computed(() => loading.value && hasLoadedFlag.value),
    isEmpty: computed(
      () => hasLoadedFlag.value && !loading.value && !error.value && rows.value.length === 0
    ),
    immediate: config.immediate,
    keepPreviousData: config.keepPreviousData
  }

  return {
    rows,
    total,
    state,
    hasLoadedFlag,
    bindAutoLoad,
    load
  }
}
