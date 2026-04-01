import { ref } from 'vue'
import type { SortingFeatureOptions, SortingFeatureState } from '../../types'

export function createSortingFeature(
  options?: boolean | SortingFeatureOptions
): SortingFeatureState | undefined {
  if (!options) return undefined

  const config = typeof options === 'object' ? options : {}

  return {
    enabled: true,
    key: ref(config.initialKey ?? null),
    order: ref(config.initialOrder ?? null)
  }
}
