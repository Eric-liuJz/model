import { h } from 'vue'
import { ElTag } from 'element-plus'
import type { TagColumn } from '../types'

export function renderTagCell<T>(column: TagColumn<T>, row: T, index: number, value: unknown) {
  const tag = column.resolveTag({ row, index, value, column })
  if (!tag) return ''

  return h(
    ElTag,
    {
      type: tag.type,
      effect: tag.effect ?? 'light'
    },
    () => tag.label
  )
}
