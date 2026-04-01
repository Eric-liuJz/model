import type { VNodeChild } from 'vue'

/**
 * 列固定方向。
 *
 * - `left`：固定在左侧
 * - `right`：固定在右侧
 * - `false`：不固定
 */
export type FixedDirection = 'left' | 'right' | false

/**
 * 列内容的水平对齐方式。
 */
export type ColumnAlign = 'left' | 'center' | 'right'

/**
 * 表头提示配置。
 *
 * 当列配置了 `headerTooltip` 后，表头标题旁边会自动显示提示图标。
 */
export interface HeaderTooltipConfig {
  /** 提示内容。 */
  content: string
  /** 提示弹层位置，默认由底层组件按 `top` 处理。 */
  placement?: string
}

/**
 * 标签列解析后的展示结果。
 *
 * `tag` 列本身不直接关心原始值如何映射，而是要求你返回一个
 * 可渲染的标签描述对象，从而把“业务值 -> UI 标签”的转换显式化。
 */
export interface TagDescriptor {
  /** 标签文本。 */
  label: string
  /** 标签类型，直接映射到 Element Plus 的 `ElTag`。 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** 标签风格，默认由运行时按 `light` 处理。 */
  effect?: 'light' | 'dark' | 'plain'
}

/**
 * 操作列中的单个按钮定义。
 *
 * 这是 `actionColumn()` 最核心的配置项之一，用来描述一行数据上有哪些操作。
 */
export interface TableActionItem<T> {
  /** 操作唯一标识。点击后会通过 `table.onAction()` 抛出。 */
  key: string
  /** 按钮显示文本。 */
  label: string
  /** 按钮视觉类型。 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  /** 二次确认文案。配置后按钮会自动包上一层确认弹窗。 */
  confirm?: string
  /** 当前行是否显示该按钮。 */
  visible?: (row: T) => boolean
  /** 当前行是否禁用该按钮。 */
  disabled?: (row: T) => boolean
}

/**
 * 单元格渲染上下文。
 *
 * 无论你是在 `renderCell`、`formatter`、`resolveTag` 还是 `href/text`
 * 里做定制，拿到的都会是这一套上下文对象。
 */
export interface CellRenderContext<T> {
  /** 当前行原始数据。 */
  row: T
  /** 当前行在“当前渲染结果”中的索引。分页后这里是当前页索引。 */
  index: number
  /** 通过 `accessor` 解析出的值。 */
  value: unknown
  /** 当前列定义本身。 */
  column: TableColumn<T>
}

/**
 * 表头渲染上下文。
 */
export interface HeaderRenderContext<T> {
  /** 当前列定义。 */
  column: TableColumn<T>
  /** 当前列在可见列中的索引。 */
  index: number
}

/**
 * 所有列类型共享的基础配置。
 *
 * 如果你在使用 builder 函数（如 `textColumn()`、`tagColumn()`），
 * 那么这里的大部分字段都可以直接透传。
 */
export interface BaseColumn<T, Kind extends string> {
  /** 列类型标识，由 builder 自动注入，一般不需要手写。 */
  kind: Kind
  /** 列唯一 key。 */
  key: string
  /** 表头标题。 */
  title?: string
  /** 固定宽度，支持 number 或 `'120px'` 形式的字符串。 */
  width?: number | string
  /** 最小宽度。 */
  minWidth?: number | string
  /** 水平对齐方式。 */
  align?: ColumnAlign
  /** 固定方向。 */
  fixed?: FixedDirection
  /** 初始是否可见。未配置时默认可见。 */
  visible?: boolean
  /**
   * 是否可排序。
   *
   * 在 v2 中，排序最终由 controller 接管。
   * 标准表格 adapter 会把可排序列下发成 `custom` 排序模式。
   */
  sortable?: boolean | 'custom'
  /** 透传给底层列的类名。 */
  className?: string
  /** 表头提示配置。 */
  headerTooltip?: string | HeaderTooltipConfig
  /** 完全自定义表头渲染。 */
  renderHeader?: (context: HeaderRenderContext<T>) => VNodeChild
}

/**
 * 具备取值能力的列基类。
 *
 * 常见的数据列（文本、日期、标签、链接）都基于它扩展。
 */
export interface AccessorColumn<T, Kind extends string> extends BaseColumn<T, Kind> {
  /**
   * 取值方式。
   *
   * - 传字段名：`accessor: 'name'`
   * - 传函数：`accessor: (row) => row.profile.name`
   */
  accessor: keyof T | ((row: T) => unknown)
  /** 完全覆盖默认单元格渲染。 */
  renderCell?: (context: CellRenderContext<T>) => VNodeChild
}

/**
 * 文本列。
 *
 * 最通用的列类型，适合纯文本、数字、简单映射展示等场景。
 */
export interface TextColumn<T> extends AccessorColumn<T, 'text'> {
  /** 在默认文本渲染前做一次格式化。 */
  formatter?: (context: CellRenderContext<T>) => VNodeChild
  /** 超出宽度时是否显示 tooltip。 */
  overflowTooltip?: boolean
}

/**
 * 日期列。
 *
 * 运行时会基于 `dayjs` 按 `format` 格式化输出。
 */
export interface DateColumn<T> extends AccessorColumn<T, 'date'> {
  /** 日期格式，默认 `'YYYY-MM-DD HH:mm:ss'`。 */
  format?: string
  /** 原始值为空时的占位文本。 */
  emptyText?: string
}

/**
 * 标签列。
 *
 * 适合状态、等级、类型等“值域有限且需要视觉区分”的场景。
 */
export interface TagColumn<T> extends AccessorColumn<T, 'tag'> {
  /**
   * 根据当前单元格值返回标签描述。
   *
   * 如果返回 `null/undefined`，则当前单元格按空内容处理。
   */
  resolveTag: (context: CellRenderContext<T>) => TagDescriptor | null | undefined
}

/**
 * 链接列。
 *
 * 用于将数据渲染为可点击链接。常见于详情页、外部地址、资料跳转等场景。
 */
export interface LinkColumn<T> extends AccessorColumn<T, 'link'> {
  /** 目标链接地址。默认回退到 `accessor` 的原始值。 */
  href?: (context: CellRenderContext<T>) => string
  /** 显示文本。默认回退到 `accessor` 的原始值。 */
  text?: (context: CellRenderContext<T>) => string
  /** 打开方式，默认 `_blank`。 */
  target?: '_self' | '_blank'
}

/**
 * 操作列。
 *
 * 与普通数据列不同，操作列不依赖 `accessor` 取值，而是通过 `actions`
 * 或自定义 `renderCell` 输出按钮/操作区。
 */
export interface ActionColumn<T> extends BaseColumn<T, 'action'> {
  /** 当前列包含的操作列表。 */
  actions: TableActionItem<T>[]
  /** 自定义操作区渲染；配置后会覆盖默认按钮组渲染。 */
  renderCell?: (context: CellRenderContext<T>) => VNodeChild
}

/**
 * 勾选列。
 *
 * 标准表格 adapter 会渲染为底层 selection 列；
 * 虚拟表格 adapter 当前不会启用对应原生能力。
 */
export interface SelectionColumn<T> extends BaseColumn<T, 'selection'> {
  /** 当前行是否允许被勾选。 */
  selectable?: (row: T, index: number) => boolean
}

/**
 * 序号列。
 *
 * v2 的序号列由 runtime 自己计算，因此标准表格和虚拟表格的行为是一致的。
 */
export interface IndexColumn<T> extends BaseColumn<T, 'index'> {
  /** 序号起始值，默认从 `1` 开始。 */
  start?: number
}

/**
 * 展开列。
 *
 * 仅在支持展开行的 adapter 中生效。
 */
export interface ExpandColumn<T> extends BaseColumn<T, 'expand'> {
  /** 展开区域渲染函数。 */
  renderExpand: (context: { row: T; index: number; column: ExpandColumn<T> }) => VNodeChild
}

/**
 * 对外暴露的统一列协议。
 *
 * 调用方通常不直接手写这个联合类型，而是通过 `textColumn()` /
 * `tagColumn()` / `actionColumn()` 等 builder 来创建具体列定义。
 */
export type TableColumn<T> =
  | TextColumn<T>
  | DateColumn<T>
  | TagColumn<T>
  | LinkColumn<T>
  | ActionColumn<T>
  | SelectionColumn<T>
  | IndexColumn<T>
  | ExpandColumn<T>

/**
 * 列设置 feature 的持久化状态结构。
 *
 * 这是运行时状态，不是建议业务手动创建的类型。
 */
export interface ColumnSettingsState {
  /** 对应列的 key。 */
  key: string
  /** 当前用于显示的标题。 */
  title: string
  /** 当前是否可见。 */
  visible: boolean
  /** 当前固定方向。 */
  fixed: FixedDirection
}

/**
 * 运行时解析后的列定义。
 *
 * 与原始 `TableColumn` 相比，它额外补齐了：
 * - 默认标题
 * - 当前可见性和固定状态
 * - 统一的取值函数
 * - 统一的 header/cell 渲染函数
 *
 * 这个类型主要提供给内部 runtime 和 adapter 使用，业务层通常不需要手动构造。
 */
export type ResolvedColumn<T> = TableColumn<T> & {
  /** 运行时列 id，目前与 `key` 等价。 */
  id: string
  /** 已补齐默认值后的标题。 */
  title: string
  /** 已合并 feature 状态后的可见性。 */
  visible: boolean
  /** 已合并 feature 状态后的固定方向。 */
  fixed: FixedDirection
  /** 统一取值函数。 */
  getValue: (row: T, index: number) => unknown
  /** 统一表头渲染函数。 */
  renderHeaderContent: (index: number) => VNodeChild
  /** 统一单元格渲染函数。 */
  renderCellContent: (row: T, index: number) => VNodeChild
}
