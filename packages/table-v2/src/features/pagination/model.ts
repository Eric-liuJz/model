import { computed, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import type { PaginationFeatureOptions, PaginationFeatureState } from '../../types'

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100]

export function createPaginationFeature(
  total: ComputedRef<number>,
  options?: boolean | PaginationFeatureOptions,
  canClamp?: ComputedRef<boolean>
): PaginationFeatureState | undefined {
  if (!options) return undefined

  const config = typeof options === 'object' ? options : {}
  const currentPage = ref(config.page ?? 1)
  const pageSize = ref(config.pageSize ?? config.pageSizes?.[0] ?? 10)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  watch(
    pageCount,
    (nextPageCount) => {
      if (canClamp && !canClamp.value) return

      if (currentPage.value > nextPageCount) {
        currentPage.value = nextPageCount
      }

      if (currentPage.value < 1) {
        currentPage.value = 1
      }
    },
    { immediate: true }
  )

  return {
    enabled: true,
    currentPage,
    pageSize,
    total,
    pageSizes: config.pageSizes ?? DEFAULT_PAGE_SIZES,
    layout: config.layout ?? 'total, sizes, prev, pager, next, jumper',
    background: config.background ?? true,
    hideOnSinglePage: config.hideOnSinglePage ?? false,
    small: config.small ?? false
  }
}
