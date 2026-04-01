import { computed, h } from 'vue'
import { ElIcon, ElTooltip } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import type {
  ColumnSettingsFeatureState,
  PaginationFeatureState,
  ResolvedColumn,
  TableColumn
} from '../types'
import { renderActionCell } from '../renderers/action'
import { renderDateCell } from '../renderers/date'
import { renderLinkCell } from '../renderers/link'
import { renderTagCell } from '../renderers/tag'
import { renderTextCell } from '../renderers/text'

function getColumnValue<T>(column: TableColumn<T>, row: T) {
  if ('accessor' in column) {
    return typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor]
  }

  return undefined
}

function renderHeaderTooltip(content: string | { content: string; placement?: string }) {
  const tooltipContent = typeof content === 'string' ? content : content.content
  const placement = typeof content === 'string' ? 'top' : (content.placement ?? 'top')

  return h(
    ElTooltip,
    {
      content: tooltipContent,
      placement: placement as any
    },
    {
      default: () =>
        h(
          ElIcon,
          {
            style: 'margin-left: 4px; cursor: help; vertical-align: middle;'
          },
          () => h(QuestionFilled)
        )
    }
  )
}

export function createColumnRuntime<T>(options: {
  columns: TableColumn<T>[]
  columnSettings?: ColumnSettingsFeatureState
  pagination?: PaginationFeatureState
  emitAction: (payload: { action: string; row: T; index: number; columnKey: string }) => void
}) {
  const stateMap = computed(() => {
    const states = options.columnSettings?.columns.value ?? []
    return new Map(states.map((state) => [state.key, state]))
  })

  return computed<ResolvedColumn<T>[]>(() => {
    // 一旦启用列设置能力，列顺序和显隐都以持久化状态为准；
    // schema 本身退化为“静态定义”，运行时顺序由用户配置接管。
    const baseColumns = options.columnSettings?.columns.value?.length
      ? options.columnSettings.columns.value
          .map((state) => options.columns.find((column) => column.key === state.key))
          .filter((column): column is TableColumn<T> => Boolean(column))
      : options.columns

    return baseColumns
      .map((column) => {
        const state = stateMap.value.get(column.key)
        const title = column.title ?? column.key

        const resolved: ResolvedColumn<T> = {
          ...column,
          id: column.key,
          title,
          visible: state?.visible ?? column.visible ?? true,
          fixed: state?.fixed ?? column.fixed ?? false,
          getValue: (row: T) => getColumnValue(column, row),
          renderHeaderContent: (index: number) => {
            if (column.renderHeader) {
              return column.renderHeader({ column, index })
            }

            if (!column.headerTooltip) return title

            return h('span', null, [title, renderHeaderTooltip(column.headerTooltip)])
          },
          renderCellContent: (row: T, index: number) => {
            const value = getColumnValue(column, row)

            // 这里是 v2 的单元格分发中心。
            // adapter 不需要知道每种列怎么渲染，只消费统一产出的 renderCellContent。
            switch (column.kind) {
              case 'text':
                if (column.renderCell) return column.renderCell({ row, index, value, column })
                return renderTextCell(column, row, index, value)
              case 'date':
                if (column.renderCell) return column.renderCell({ row, index, value, column })
                return renderDateCell(column, value)
              case 'tag':
                if (column.renderCell) return column.renderCell({ row, index, value, column })
                return renderTagCell(column, row, index, value)
              case 'link':
                if (column.renderCell) return column.renderCell({ row, index, value, column })
                return renderLinkCell(column, row, index, value)
              case 'action':
                if (column.renderCell) return column.renderCell({ row, index, value, column })
                return renderActionCell(column.actions, row, (action) => {
                  options.emitAction({ action, row, index, columnKey: column.key })
                })
              case 'index': {
                // 序号列默认跟随分页偏移，保证翻页后仍然是“全局序号”。
                const pageOffset = options.pagination
                  ? (options.pagination.currentPage.value - 1) * options.pagination.pageSize.value
                  : 0
                return (column.start ?? 1) + pageOffset + index
              }
              case 'expand':
              case 'selection':
                return ''
              default:
                return ''
            }
          }
        }

        return resolved
      })
      .filter((column) => column.visible)
  })
}
