import type { VNode } from 'vue'

/**
 * 渲染工厂支持的预设单元格类型枚举。
 * 该类型标识决定了底层渲染工厂将装载哪个原子展现组件。
 */
export type ColumnType =
  | 'text' // 默认纯文本输出
  | 'date' // 时间格式化渲染
  | 'tag' // 枚举标签渲染（根据字典映射颜色与文本）
  | 'link' // 超链接锚文本渲染
  | 'action' // 操作按钮组合列
  | 'selection' // 批量勾选列
  | 'index' // 自增序号列
  | 'expand' // 详情展开列

/**
 * 表头浮层提示的深层配置接口。
 */
export interface HeaderTooltipConfig {
  /** 气泡展示的提示内容文本 */
  content: string
  /** 气泡相对于图标的弹出方位 */
  placement?: string
}

/**
 * 操作列按钮的单项配置。
 * 用于配置驱动模式下自动生成操作按钮组。
 */
export interface ActionItem {
  /** 按钮展示文本 */
  label: string
  /** 事件标识（触发时通过 action 事件向上抛出） */
  event: string
  /** 按钮类型样式 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  /** 二次确认弹窗文案（设置后自动挂载 el-popconfirm） */
  confirm?: string
  /**
   * 动态可见性判定函数。
   * 返回 false 时该按钮在当前行隐藏。
   */
  visible?: (row: any) => boolean
}

/**
 * 表格列的核心配置接口。
 *
 * 该配置项决定了列的底层数据绑定、UI 展现层的渲染工厂分发
 * 以及交互行为的状态控制，是整个组件库的 Single Source of Truth。
 *
 * @template T - 业务行数据的泛型结构
 */
export interface ColumnConfig<T = Record<string, any>> {
  // ==========================================
  // 1. 数据绑定与骨架 (Data Binding & Skeleton)
  // ==========================================

  /**
   * 关联的数据源字段名。
   * 特殊业务列需采用内部预留常量标识：
   * - 'action':    操作按钮列
   * - 'selection': 批量勾选列
   * - 'expand':    详情展开列
   */
  prop: keyof T | 'action' | 'selection' | 'expand' | string

  /** 表头展示的本地化文本 */
  label?: string

  // ==========================================
  // 2. 布局与样式 (Layout & Styling)
  // ==========================================

  /** 固定像素宽度或 CSS 宽度字符串 */
  width?: number | string

  /** 最小像素宽度或 CSS 宽度字符串（适用于弹性布局） */
  minWidth?: number | string

  /** 单元格内容的水平对齐方式 */
  align?: 'left' | 'center' | 'right'

  // ==========================================
  // 3. 渲染引擎与工厂分发 (Renderer Distribution)
  // ==========================================

  /**
   * 渲染器类型标识。
   * 未设置时默认采用 'text' 策略。
   */
  type?: ColumnType

  /**
   * 为指定渲染器提供的多态传参字典。
   *
   * @example type: 'tag'  => { '1': { text: '成功', type: 'success' } }
   * @example type: 'date' => { format: 'YYYY-MM-DD HH:mm:ss' }
   */
  typeOptions?: Record<string, any>

  // ==========================================
  // 4. 表头增强 (Header Augmentations)
  // ==========================================

  /**
   * 表头侧边栏的浮层信息提示。
   * 传入纯字符串将自动生成问号图标与气泡；传入对象则支持弹出方位等深层定制。
   */
  headerTooltip?: string | HeaderTooltipConfig

  /**
   * 高阶自定义表头渲染函数（等价于 #header 具名插槽）。
   *
   * @param column - 当前列的完整配置上下文
   * @param index  - 当前列的物理索引位置
   * @returns 合法的 Vue VNode 结构
   */
  renderHeader?: (column: ColumnConfig<T>, index: number) => VNode | string | any

  // ==========================================
  // 5. 交互行为控制 (Interaction Control)
  // ==========================================

  /** 初始可见性标志，后续由状态引擎接管派生（默认: true） */
  show?: boolean

  /**
   * 视窗边缘固定吸附策略。
   * 在水平滚动时保障关键列的视野曝光。
   */
  fixed?: 'left' | 'right' | false

  // --- Element Plus Native Props ---

  /** 是否可排序 */
  sortable?: boolean | 'custom'

  /** 列的 className */
  className?: string

  /** 当内容过长被隐藏时显示 tooltip */
  showOverflowTooltip?: boolean

  /**
   * 表头过滤器的枚举字典。
   * 设置后将自动在表头挂载漏斗图标，并弹出下拉勾选面板。
   * @example [{ text: '正常', value: 'active' }, { text: '封禁', value: 'banned' }]
   */
  filters?: { text: string; value: any }[]

  /** 过滤是否支持多选（默认 true） */
  filterMultiple?: boolean

  /** 过滤面板弹出方位 */
  filterPlacement?: string

  // ==========================================
  // 6. 高阶内容定制 (Advanced Custom Renderer)
  // ==========================================

  /**
   * 对默认工厂行为进行完全覆盖的单元格渲染函数。
   * 用于处理极其复合或强业务耦合的定制场景。
   *
   * @param row   - 未被污染的当前行数据模型
   * @param index - 行逻辑索引
   * @returns 合法的 Vue VNode 结构
   */
  renderCell?: (row: T, index: number) => VNode | string | any
}

/**
 * 由状态派生引擎管理的列瞬态属性。
 * 用于持久化/响应式追踪列的可见性、固定位置及宽度偏移。
 */
export interface ColumnState {
  /** 关联源 ColumnConfig 的唯一标识 */
  prop: string
  /** 关联源 ColumnConfig 的展示标签，供工具栏使用 */
  label?: string
  /** 响应式可见性状态 */
  show: boolean
  /** 响应式固定吸附方向 */
  fixed: 'left' | 'right' | false
  /** 用户拖拽调整后的宽度覆写值 */
  width?: number | string
}
