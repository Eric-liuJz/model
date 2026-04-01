import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ColumnSettingsState, FixedDirection, ResolvedColumn, TableColumn } from './column'

/**
 * 表格视图模式。
 *
 * - `table`：标准表格，基于 `el-table`
 * - `virtual`：虚拟表格，基于 `el-table-v2`
 */
export type TableViewMode = 'table' | 'virtual'

/**
 * 分页 feature 配置。
 */
export interface PaginationFeatureOptions {
  /** 初始页码，默认 `1`。 */
  page?: number
  /** 初始每页条数。 */
  pageSize?: number
  /** 每页条数候选项。 */
  pageSizes?: number[]
  /** 分页布局，透传给底层分页组件。 */
  layout?: string
  /** 是否启用背景样式。 */
  background?: boolean
  /** 单页时是否隐藏。 */
  hideOnSinglePage?: boolean
  /** 是否启用紧凑尺寸。 */
  small?: boolean
}

/**
 * 列设置 feature 配置。
 */
export interface ColumnSettingsFeatureOptions {
  /**
   * 本地缓存 key。
   *
   * 配置后，列顺序/显隐/固定状态会持久化到 LocalStorage。
   */
  cacheKey?: string
}

/**
 * 导出 feature 配置。
 */
export interface ExportFeatureOptions {
  /** 导出的文件名，不需要手动拼 `.xlsx`。 */
  filename?: string
  /** 工作表名称。 */
  sheetName?: string
}

/**
 * 勾选 feature 配置。
 */
export interface SelectionFeatureOptions {
  /** 是否启用勾选能力。 */
  enabled?: boolean
}

/**
 * 排序 feature 配置。
 */
export interface SortingFeatureOptions {
  /** 初始排序列 key。 */
  initialKey?: string
  /** 初始排序方向。 */
  initialOrder?: 'ascending' | 'descending' | null
}

/**
 * createStarTable 的 feature 总入口。
 *
 * 大多数 feature 都支持两种写法：
 * - `true`：按默认配置启用
 * - 传对象：按自定义配置启用
 */
export interface TableFeatureOptions {
  pagination?: boolean | PaginationFeatureOptions
  columnSettings?: boolean | ColumnSettingsFeatureOptions
  export?: boolean | ExportFeatureOptions
  selection?: boolean | SelectionFeatureOptions
  sorting?: boolean | SortingFeatureOptions
}

/**
 * 操作列触发后的事件载荷。
 */
export interface TableActionPayload<T> {
  /** 触发的 action key。 */
  action: string
  /** 当前行原始数据。 */
  row: T
  /** 当前行索引。 */
  index: number
  /** 触发动作的列 key。 */
  columnKey: string
}

/**
 * 分页 feature 运行时状态。
 *
 * 这是 controller 暴露给 UI 层的状态结构，业务通常只读不写。
 */
export interface PaginationFeatureState {
  enabled: boolean
  currentPage: Ref<number>
  pageSize: Ref<number>
  total: ComputedRef<number>
  pageSizes: number[]
  layout: string
  background: boolean
  hideOnSinglePage: boolean
  small: boolean
}

/**
 * 列设置 feature 运行时状态。
 */
export interface ColumnSettingsFeatureState {
  enabled: boolean
  cacheKey?: string
  /** 当前列设置状态数组，顺序即当前展示顺序。 */
  columns: Ref<ColumnSettingsState[]>
}

/**
 * 勾选 feature 运行时状态。
 */
export interface SelectionFeatureState<T> {
  enabled: boolean
  /** 当前已选中的行数据。 */
  rows: Ref<T[]>
  /** 当前已选中行对应的 key 集合。 */
  keys: ComputedRef<Array<string | number>>
}

/**
 * 排序 feature 运行时状态。
 */
export interface SortingFeatureState {
  enabled: boolean
  /** 当前排序列 key。 */
  key: Ref<string | null>
  /** 当前排序方向。 */
  order: Ref<'ascending' | 'descending' | null>
}

/**
 * controller 聚合后的 feature 状态。
 *
 * 没有启用的 feature 对应字段会是 `undefined`。
 */
export interface TableControllerState<T> {
  pagination?: PaginationFeatureState
  columnSettings?: ColumnSettingsFeatureState
  selection?: SelectionFeatureState<T>
  sorting?: SortingFeatureState
}

/**
 * controller 对外暴露的动作集合。
 *
 * 这些方法是 UI 层和业务层修改表格状态的标准入口。
 */
export interface TableControllerActions<T> {
  /** 切换页码。 */
  setPage: (page: number) => void
  /** 修改每页条数。 */
  setPageSize: (pageSize: number) => void
  /** 切换列显隐。 */
  toggleColumnVisibility: (key: string, visible: boolean) => void
  /** 修改列固定方向。 */
  pinColumn: (key: string, fixed: FixedDirection) => void
  /** 调整列顺序。 */
  reorderColumn: (from: number, to: number) => void
  /** 将列设置恢复到 schema 初始状态。 */
  resetColumns: () => void
  /** 覆盖当前选中行。通常由 adapter 在 selection-change 时调用。 */
  setSelection: (rows: T[]) => void
  /** 清空选中行。 */
  clearSelection: () => void
  /** 更新排序状态。通常由 adapter 在 sort-change 时调用。 */
  setSort: (payload: {
    prop?: string
    columnKey?: string
    order?: 'ascending' | 'descending' | null
  }) => void
  /** 导出当前表格。未启用 export feature 时也始终存在，但会静默返回。 */
  exportXlsx: () => void
}

/**
 * 创建表格 controller 的配置项。
 *
 * 这是业务侧最核心的入口类型。
 */
export interface CreateStarTableOptions<T> {
  /**
   * 数据源。
   *
   * 支持普通数组、`ref`、`computed` 或 getter。
   * v2 以这里的值作为唯一事实来源，不会在 controller 内部维护第二份可写副本。
   */
  data: MaybeRefOrGetter<T[]>
  /** 列定义数组，推荐通过 schema builder 创建。 */
  columns: TableColumn<T>[]
  /**
   * 行唯一标识。
   *
   * - 标准表格支持字段名或函数
   * - 虚拟表格在函数模式下会自动包装成稳定内部字段
   */
  rowKey: keyof T | ((row: T) => string | number)
  /** 视图模式，默认 `table`。 */
  view?: TableViewMode
  /** feature 配置集合。 */
  features?: TableFeatureOptions
}

/**
 * v2 对外暴露的核心控制器。
 *
 * 你可以把它理解成“表格运行时实例”：
 * - `schema` 描述静态结构
 * - `state` 暴露当前 feature 状态
 * - `actions` 提供统一的修改入口
 * - `rows/columns` 是已经过 runtime 处理的可渲染结果
 */
export interface TableController<T> {
  /** 当前视图模式信息。 */
  view: {
    mode: TableViewMode
    isVirtual: boolean
  }
  /** 原始 rowKey 配置。 */
  rowKey: keyof T | ((row: T) => string | number)
  /** 统一的行 id 解析函数。 */
  getRowId: (row: T) => string | number
  /** 原始列 schema。 */
  schema: TableColumn<T>[]
  /** 外部传入的数据源快照。 */
  data: ComputedRef<T[]>
  /** 排序后的全量数据。 */
  allRows: ComputedRef<T[]>
  /** 当前视图真正要渲染的数据，通常已经过分页裁剪。 */
  rows: ComputedRef<T[]>
  /** 当前视图真正要渲染的列，通常已经合并列设置状态。 */
  columns: ComputedRef<ResolvedColumn<T>[]>
  /** feature 状态聚合。 */
  state: TableControllerState<T>
  /** 动作集合。 */
  actions: TableControllerActions<T>
  /**
   * 监听操作列事件。
   *
   * 返回值是一个取消监听函数，组件卸载时记得调用。
   */
  onAction: (handler: (payload: TableActionPayload<T>) => void) => () => void
}
