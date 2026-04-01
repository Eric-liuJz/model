import type { TextColumn } from '../types'

export function renderTextCell<T>(column: TextColumn<T>, row: T, index: number, value: unknown) {
  if (column.formatter) {
    return column.formatter({ row, index, value, column })
  }

  return value == null ? '' : String(value)
}
