import { computed, shallowRef } from 'vue'
import type { SelectionFeatureOptions, SelectionFeatureState } from '../../types'

export function createSelectionFeature<T>(
  rowKeyGetter: (row: T) => string | number,
  options?: boolean | SelectionFeatureOptions
): SelectionFeatureState<T> | undefined {
  if (!options) return undefined

  const rows = shallowRef<T[]>([])

  return {
    enabled: typeof options === 'object' ? (options.enabled ?? true) : true,
    rows,
    keys: computed(() => rows.value.map((row) => rowKeyGetter(row)))
  }
}
