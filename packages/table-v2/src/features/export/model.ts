import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import type { ExportFeatureOptions, ResolvedColumn } from '../../types'

function toCellValue<T>(column: ResolvedColumn<T>, row: T, index: number) {
  const raw = column.getValue(row, index)

  if (column.kind === 'date') {
    if (!raw) return column.emptyText ?? ''
    return dayjs(raw as string | number | Date).format(column.format ?? 'YYYY-MM-DD HH:mm:ss')
  }

  if (column.kind === 'tag') {
    return column.resolveTag({ row, index, value: raw, column })?.label ?? ''
  }

  if (column.kind === 'link') {
    return column.text?.({ row, index, value: raw, column }) ?? String(raw ?? '')
  }

  if (column.kind === 'text' && column.formatter) {
    const rendered = column.formatter({ row, index, value: raw, column })
    return typeof rendered === 'string' || typeof rendered === 'number'
      ? rendered
      : String(raw ?? '')
  }

  return raw ?? ''
}

export function exportTableToXlsx<T>(
  columns: ResolvedColumn<T>[],
  rows: T[],
  options?: ExportFeatureOptions
) {
  const exportableColumns = columns.filter(
    (column) => !['selection', 'expand', 'action', 'index'].includes(column.kind)
  )

  const headers = exportableColumns.map((column) => column.title)
  const body = rows.map((row, rowIndex) =>
    exportableColumns.map((column) => toCellValue(column, row, rowIndex))
  )

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body])
  worksheet['!cols'] = exportableColumns.map((column, index) => {
    const maxLength = Math.max(
      column.title.length,
      ...body.map((cells) => String(cells[index] ?? '').length)
    )
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, options?.sheetName ?? 'Sheet1')
  XLSX.writeFile(workbook, `${options?.filename ?? 'export'}.xlsx`)
}
