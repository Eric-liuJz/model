import { computed, type Ref } from 'vue'
import type { PaginationConfig } from '../types/pagination'

/**
 * 分页配置聚合 Hook
 * 将复杂的默认值补全、数据合并等纯逻辑从 UI 组件中剥离，
 * 实现 UI 与逻辑的彻底解耦。
 */
export function usePagination(configRef: Ref<boolean | PaginationConfig | undefined>) {
  const mergedConfig = computed<PaginationConfig | null>(() => {
    const config = configRef.value
    if (!config) return null

    // 默认的“企业级”标准分页配置
    const base: PaginationConfig = {
      layout: 'total, sizes, prev, pager, next, jumper',
      background: true,
      pageSizes: [10, 20, 50, 100],
      hideOnSinglePage: false,
      small: false
    }

    if (typeof config === 'object') {
      return { ...base, ...config }
    }

    return base
  })

  return {
    mergedConfig
  }
}
