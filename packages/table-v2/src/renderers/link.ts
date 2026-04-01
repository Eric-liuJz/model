import { h } from 'vue'
import { ElLink } from 'element-plus'
import type { LinkColumn } from '../types'

export function renderLinkCell<T>(column: LinkColumn<T>, row: T, index: number, value: unknown) {
  const href = column.href?.({ row, index, value, column }) ?? String(value ?? '')
  const text = column.text?.({ row, index, value, column }) ?? String(value ?? '')

  return h(
    ElLink,
    {
      href,
      target: column.target ?? '_blank',
      type: 'primary'
    },
    () => text
  )
}
