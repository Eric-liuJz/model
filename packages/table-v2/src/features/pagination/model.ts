import { computed, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import type { PaginationFeatureOptions, PaginationFeatureState } from '../../types'

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100]

export function sanitizePositiveInt(value: unknown, fallback: number) {
  const nextValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(nextValue) || nextValue < 1) {
    return fallback
  }

  return nextValue
}

function sanitizePageSizes(pageSizes?: number[]) {
  const sanitized = (pageSizes ?? DEFAULT_PAGE_SIZES)
    .map((value) => sanitizePositiveInt(value, 0))
    .filter((value) => value > 0)

  return sanitized.length > 0 ? Array.from(new Set(sanitized)) : DEFAULT_PAGE_SIZES
}

export function createPaginationFeature(
  total: ComputedRef<number>,
  options?: boolean | PaginationFeatureOptions,
  canClamp?: ComputedRef<boolean>
): PaginationFeatureState | undefined {
  if (!options) return undefined

  const config = typeof options === 'object' ? options : {}
  const pageSizes = sanitizePageSizes(config.pageSizes)
  const currentPage = ref(sanitizePositiveInt(config.page, 1))
  const pageSize = ref(sanitizePositiveInt(config.pageSize, pageSizes[0] ?? 10))
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  watch(pageSize, (nextPageSize) => {
    const sanitized = sanitizePositiveInt(nextPageSize, pageSizes[0] ?? 10)
    if (sanitized !== nextPageSize) {
      pageSize.value = sanitized
    }
  })

  watch(currentPage, (nextPage) => {
    const sanitized = sanitizePositiveInt(nextPage, 1)
    if (sanitized !== nextPage) {
      currentPage.value = sanitized
    }
  })

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
    pageSizes,
    layout: config.layout ?? 'total, sizes, prev, pager, next, jumper',
    background: config.background ?? true,
    hideOnSinglePage: config.hideOnSinglePage ?? false,
    small: config.small ?? false
  }
}
