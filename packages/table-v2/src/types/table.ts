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
  /**
   * 导出范围。
   *
   * - `all`：导出当前 controller 可访问的全部数据
   * - `current`：仅导出当前已加载 / 当前页数据
   *
   * 远程模式下如果不显式声明为 `current`，框架会默认关闭导出按钮，
   * 避免误导成“导出全部远程数据”。
   */
  scope?: 'all' | 'current'
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
 * 远程请求时使用的排序参数。
 */
export interface TableSortParams {
  /** 当前排序列 key。未排序时为 `null`。 */
  key: string | null
  /** 当前排序方向。未排序时为 `null`。 */
  order: 'ascending' | 'descending' | null
}

/**
 * `getData` 统一收到的请求上下文。
 *
 * 表格会负责整理分页、排序和查询条件，业务层只需要把它映射到自己的接口协议。
 */
export interface TableGetDataParams {
  /** 当前页码。 */
  page: number
  /** 每页条数。 */
  pageSize: number
  /** 当前排序状态。 */
  sort: TableSortParams
  /** 外部传入的查询条件快照。 */
  query: Record<string, unknown>
}

/**
 * `getData` 的标准返回结构。
 *
 * 无论你的后端返回的是 `list/total`、`records/count` 还是其他结构，
 * 都建议在 `getData` 中先转换为这个统一结果再交给表格。
 */
export interface TableGetDataResult<T> {
  /** 当前请求返回的数据行。 */
  rows: T[]
  /** 当前查询条件下的总条数。 */
  total: number
}

/**
 * 远程数据加载状态。
 */
export type RemoteLoadStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * 一次远程数据请求的上下文。
 *
 * 所有远程生命周期钩子都会收到这一份上下文，用于统一感知当前请求行为。
 */
export interface TableRemoteLoadContext<T> {
  /** 当前请求序号。每次发起请求都会自增。 */
  requestId: number
  /** 当前请求参数。 */
  params: TableGetDataParams
  /** 当前是否属于显式 reload。 */
  manual: boolean
  /** 当前加载完成后的状态。 */
  status: RemoteLoadStatus
  /** 当前请求结果。失败时为 `null`。 */
  result: TableGetDataResult<T> | null
  /** 当前请求错误。成功时为 `null`。 */
  error: unknown | null
}

/**
 * 远程模式扩展配置。
 *
 * 用来控制远程取数行为和生命周期回调。
 */
export interface TableRemoteOptions<T> {
  /** 是否在创建 controller 后立即请求，默认 `true`。 */
  immediate?: boolean
  /**
   * 加载新数据时是否保留上一批结果，默认 `true`。
   *
   * - `true`：加载中继续显示旧数据
   * - `false`：发起请求时先清空当前数据
   */
  keepPreviousData?: boolean
  /**
   * 请求发起前触发。
   *
   * 适合做埋点、补充日志或同步外围状态。即便钩子内部抛错，也不会中断主请求。
   */
  onBeforeLoad?: (params: TableGetDataParams) => void | Promise<void>
  /**
   * 请求成功后触发。
   *
   * 此时 controller 的 `rows / total / status` 已经更新完成，可以安全读取最新状态。
   */
  onLoadSuccess?: (
    result: TableGetDataResult<T>,
    params: TableGetDataParams,
    context: TableRemoteLoadContext<T>
  ) => void | Promise<void>
  /**
   * 请求失败后触发。
   *
   * 此时 controller 的 `error / status` 已经更新完成，适合统一提示或错误上报。
   */
  onLoadError?: (
    error: unknown,
    params: TableGetDataParams,
    context: TableRemoteLoadContext<T>
  ) => void | Promise<void>
  /**
   * 请求结束后触发，无论成功还是失败。
   *
   * `onLoadFinally` 会在当前请求状态写回 controller 后触发，因此更适合做收尾埋点。
   */
  onLoadFinally?: (context: TableRemoteLoadContext<T>) => void | Promise<void>
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
 * 导出 feature 运行时状态。
 */
export interface ExportFeatureState {
  enabled: boolean
  /** 当前导出范围。 */
  scope: 'all' | 'current'
  /**
   * 当前是否允许导出。
   *
   * 远程模式下默认不会假装支持“导出全部”，需要业务显式声明导出范围。
   */
  available: boolean
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
 * 远程数据模式运行时状态。
 */
export interface RemoteDataFeatureState<T> {
  enabled: boolean
  /** 当前加载状态。 */
  status: Ref<RemoteLoadStatus>
  /** 当前是否正在请求。 */
  loading: Ref<boolean>
  /** 最近一次请求错误。成功请求后会重置为 `null`。 */
  error: Ref<unknown | null>
  /** 最近一次请求返回的行数据。 */
  rows: Ref<T[]>
  /** 最近一次请求返回的总条数。 */
  total: Ref<number>
  /** 当前查询条件快照。 */
  query: ComputedRef<Record<string, unknown>>
  /** 最近一次成功请求完成时间。 */
  lastUpdatedAt: Ref<number | null>
  /** 是否至少完成过一次请求。 */
  hasLoaded: ComputedRef<boolean>
  /**
   * 是否属于“已有旧数据时再次加载”。
   *
   * 常见于分页、排序、筛选切换后仍保留上一批结果的场景。
   */
  isReloading: ComputedRef<boolean>
  /**
   * 当前是否为空结果。
   *
   * 只有当请求至少完成一次、当前不在加载中且没有错误时才会为 `true`。
   */
  isEmpty: ComputedRef<boolean>
  /** 是否在创建 controller 后立即请求。 */
  immediate: boolean
  /** 加载新数据时是否保留旧数据。 */
  keepPreviousData: boolean
}

/**
 * `StarTableView` 状态插槽收到的上下文。
 *
 * 这些数据已经把 controller 里的远程状态做了扁平化处理，
 * 业务层通常不需要再自己回到 `table.state.remote` 里拆值。
 */
export interface TableViewStateSlotProps<T> {
  /** 当前表格 controller。 */
  table: TableController<T>
  /** 远程状态对象；本地模式下为 `undefined`。 */
  remote?: RemoteDataFeatureState<T>
  /** 当前整体状态。 */
  status: RemoteLoadStatus | 'local'
  /** 当前是否处于请求中。 */
  loading: boolean
  /** 是否至少完成过一次远程请求。 */
  hasLoaded: boolean
  /** 当前是否已有可渲染的行数据。 */
  hasRows: boolean
  /** 当前是否为空结果。 */
  isEmpty: boolean
  /** 当前是否属于“保留旧数据时的再次刷新”。 */
  isReloading: boolean
  /** 最近一次错误对象。 */
  error: unknown | null
  /** 重新触发一次当前上下文的数据加载。 */
  reload: () => Promise<void>
}

/**
 * controller 聚合后的 feature 状态。
 *
 * 没有启用的 feature 对应字段会是 `undefined`。
 */
export interface TableControllerState<T> {
  pagination?: PaginationFeatureState
  columnSettings?: ColumnSettingsFeatureState
  export?: ExportFeatureState
  selection?: SelectionFeatureState<T>
  sorting?: SortingFeatureState
  remote?: RemoteDataFeatureState<T>
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
  /** 重新触发一次数据加载。远程模式下会再次调用 `getData`。 */
  reload: () => Promise<void>
  /** 导出当前表格。未启用 export feature 时也始终存在，但会静默返回。 */
  exportXlsx: () => void
}

/**
 * 创建表格 controller 的公共配置。
 */
export interface CreateStarTableBaseOptions<T> {
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
 * 本地数据模式配置。
 */
export interface CreateLocalStarTableOptions<T> extends CreateStarTableBaseOptions<T> {
  /**
   * 数据源。
   *
   * 支持普通数组、`ref`、`computed` 或 getter。
   * v2 以这里的值作为唯一事实来源，不会在 controller 内部维护第二份可写副本。
   */
  data: MaybeRefOrGetter<T[]>
  /** 本地模式下不需要传 `getData`。 */
  getData?: never
  /** 本地模式下不使用远程 query。 */
  query?: never
  /** 本地模式下不使用远程行为配置。 */
  remote?: never
}

/**
 * 远程数据模式配置。
 */
export interface CreateRemoteStarTableOptions<T> extends CreateStarTableBaseOptions<T> {
  /**
   * 异步取数函数。
   *
   * 表格负责整理分页、排序和查询条件，业务层负责真正发请求并返回统一结构。
   */
  getData: (params: TableGetDataParams) => Promise<TableGetDataResult<T>>
  /** 远程模式下不再直接传本地数组。 */
  data?: never
  /**
   * 查询条件快照。
   *
   * 支持普通对象、`ref`、`computed` 或 getter。
   * 当查询条件变化时，controller 会自动重新拉取数据。
   */
  query?: MaybeRefOrGetter<Record<string, unknown>>
  /** 远程行为配置。 */
  remote?: TableRemoteOptions<T>
}

/**
 * 创建表格 controller 的配置项。
 *
 * 支持两种模式：
 * - 本地模式：传 `data`
 * - 远程模式：传 `getData`
 */
export type CreateStarTableOptions<T> =
  | CreateLocalStarTableOptions<T>
  | CreateRemoteStarTableOptions<T>

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
  /**
   * 当前数据源快照。
   *
   * - 本地模式：等于外部传入的 `data`
   * - 远程模式：等于最近一次请求返回的 `rows`
   */
  data: ComputedRef<T[]>
  /**
   * 排序后的全量数据。
   *
   * 在远程模式下，通常等于最近一次请求返回的数据，不再做本地二次排序。
   */
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
