import dayjs from 'dayjs'
import type { DateColumn } from '../types'

export function renderDateCell<T>(column: DateColumn<T>, value: unknown) {
  if (!value) return column.emptyText ?? ''
  return dayjs(value as string | number | Date).format(column.format ?? 'YYYY-MM-DD HH:mm:ss')
}
