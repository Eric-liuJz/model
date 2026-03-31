import type { ColumnConfig } from './column'
import type { TrackingFn } from './telemetry'
/**
 * 组件核心数据注入参数接口。
 * 作为 useTableCore 状态派生引擎的唯一入参协议。
 *
 * @template T - 业务行数据的泛型结构
 */
export interface TableOptions<T = Record<string, any>> {
  /**
   * 不可变的列骨架配置数组（源数据）。
   * 引擎内部严禁对其进行任何直接修改。
   */
  columns: ColumnConfig<T>[]

  /**
   * 行数据主键索引定义。
   * 用于优化列表 Diff 计算以及跨分页勾选状态的持久化追踪。
   */
  rowKey?: string | ((row: T) => string | number)

  /**
   * 虚拟滚动引擎开关。
   * 激活后底盘将切换至 el-table-v2，为逾万级别的数据集实施按需渲染策略。
   */
  virtual?: boolean

  /**
   * 本地持久层标识密钥。
   * 装载后将以该 Token 通过 LocalStorage 同步和恢复列状态
   *（包括可见性、固定方向、宽度偏移等用户偏好设置）。
   */
  cacheKey?: string

  /**
   * 静默埋点上报回调函数。
   * 配置后底层交互（显示/固定/排序）将自动抛出。
   */
  track?: TrackingFn
}
