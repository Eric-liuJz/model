import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import type { ColumnConfig } from '../types/column'

/**
 * 导出数据的列映射配置。
 * 由 ColumnConfig 提取出用于 Excel 表头映射的精简结构。
 */
interface ExportColumnMap {
  /** 数据字段名 */
  prop: string
  /** 导出表头文本 */
  label: string
  /**
   * 自定义格式化函数。
   * 用于处理 tag 字典映射、日期格式化等场景，
   * 确保导出的是人类可读的文本而非原始代码。
   */
  formatter?: (value: any, row: any) => string
}

/**
 * 表格数据导出 Hook。
 *
 * 职责边界：
 * - 从 ColumnConfig 配置中自动提取可导出的列与表头映射
 * - 支持自定义格式化函数，解决 tag 字典值、时间戳等原始数据的可读性问题
 * - 基于 SheetJS (xlsx) 生成标准 .xlsx 文件并触发浏览器下载
 *
 * @example
 * ```ts
 * const { exportToExcel } = useExport()
 * exportToExcel({
 *   columns: visibleColumns.value,
 *   data: tableData.value,
 *   filename: '用户列表'
 * })
 * ```
 */
export function useExport() {

  /**
   * 从 ColumnConfig 中自动提取可导出的列映射。
   * 自动排除 selection、expand、action、index 等功能型列。
   */
  const resolveExportColumns = <T>(columns: ColumnConfig<T>[]): ExportColumnMap[] => {
    const excludeTypes = new Set(['selection', 'expand', 'action', 'index'])

    return columns
      .filter(col => !excludeTypes.has(col.type as string) && col.label)
      .map(col => ({
        prop: String(col.prop),
        label: col.label!,
        formatter: buildFormatter(col)
      }))
  }

  /**
   * 根据列类型自动构建格式化函数。
   * - tag 类型：查字典取 text
   * - date 类型：格式化时间戳
   * - 其他类型：直接原样输出
   */
  const buildFormatter = <T>(col: ColumnConfig<T>): ((value: any, row: any) => string) | undefined => {
    if (col.type === 'tag' && col.typeOptions) {
      const dict = col.typeOptions as Record<string, { text: string }>
      return (value: any) => {
        const entry = dict[String(value)]
        return entry ? entry.text : String(value ?? '')
      }
    }

    if (col.type === 'date' && col.typeOptions) {
      const fmt = (col.typeOptions as any).format || 'YYYY-MM-DD HH:mm:ss'
      return (value: any) => {
        if (!value) return ''
        return dayjs(value).format(fmt)
      }
    }

    return undefined
  }

  /**
   * 执行 Excel 导出。
   *
   * @param options.columns  - 当前可见的列配置（建议传入 visibleColumns）
   * @param options.data     - 表格数据源
   * @param options.filename - 导出文件名（不含扩展名，默认 'export'）
   * @param options.sheetName - 工作表名称（默认 'Sheet1'）
   * @param options.columnMaps - 自定义列映射（覆盖自动解析）
   */
  const exportToExcel = <T>(options: {
    columns: ColumnConfig<T>[]
    data: T[]
    filename?: string
    sheetName?: string
    columnMaps?: ExportColumnMap[]
  }): void => {
    const {
      columns,
      data,
      filename = 'export',
      sheetName = 'Sheet1',
      columnMaps
    } = options

    // 1. 解析列映射
    const maps = columnMaps || resolveExportColumns(columns)

    // 2. 构建表头行
    const headers = maps.map(m => m.label)

    // 3. 构建数据行
    const rows = data.map(row => {
      return maps.map(m => {
        const rawValue = (row as any)[m.prop]
        return m.formatter ? m.formatter(rawValue, row) : (rawValue ?? '')
      })
    })

    // 4. 组装工作簿
    const wsData = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // 5. 自动列宽
    ws['!cols'] = maps.map((m, i) => {
      const maxLen = Math.max(
        m.label.length,
        ...rows.map(r => String(r[i] ?? '').length)
      )
      return { wch: Math.min(Math.max(maxLen + 2, 10), 50) }
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // 6. 触发下载
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  return {
    /** 执行 Excel 导出 */
    exportToExcel,
    /** 从列配置中解析出导出列映射（可独立使用） */
    resolveExportColumns
  }
}
