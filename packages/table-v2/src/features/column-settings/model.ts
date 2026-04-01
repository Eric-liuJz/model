import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type {
  ColumnSettingsFeatureOptions,
  ColumnSettingsFeatureState,
  ColumnSettingsState,
  TableColumn
} from '../../types'

function toInitialStates<T>(columns: TableColumn<T>[]) {
  return columns.map((column) => ({
    key: column.key,
    title: column.title ?? column.key,
    visible: column.visible ?? true,
    fixed: column.fixed ?? false
  }))
}

export function createColumnSettingsFeature<T>(
  columns: TableColumn<T>[],
  options?: boolean | ColumnSettingsFeatureOptions
): ColumnSettingsFeatureState | undefined {
  if (!options) return undefined

  const config = typeof options === 'object' ? options : {}
  const initialStates = toInitialStates(columns)
  const storageKey = config.cacheKey ? `star-table-v2:${config.cacheKey}` : undefined
  const states = storageKey
    ? useLocalStorage<ColumnSettingsState[]>(
        storageKey,
        initialStates.map((state) => ({ ...state }))
      )
    : ref<ColumnSettingsState[]>(initialStates.map((state) => ({ ...state })))

  // 缓存修正策略：
  // 1. 保留仍然存在的旧列，尽量延续用户的排序和显隐偏好
  // 2. 将 schema 中新增的列补回状态表，避免新列永久不可见
  const ordered = states.value
  const reconciled = ordered.filter((state) => columns.some((column) => column.key === state.key))

  columns.forEach((column) => {
    if (!reconciled.some((state) => state.key === column.key)) {
      const initial = initialStates.find((state) => state.key === column.key)
      if (initial) reconciled.push({ ...initial })
    }
  })

  states.value = reconciled

  return {
    enabled: true,
    cacheKey: config.cacheKey,
    columns: states
  }
}
