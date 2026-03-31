import type { TrackingFn } from './telemetry'

/**
 * 分页栏配置协议
 * 映射 Element Plus 的 el-pagination 参数
 */
export interface PaginationConfig {
  /** 分页栏布局，默认 'total, sizes, prev, pager, next, jumper' */
  layout?: string
  /** 是否带有背景色，默认 true */
  background?: boolean
  /** 每页显示条数选项，默认 [10, 20, 50, 100] */
  pageSizes?: number[]
  /** 只有一页时是否隐藏，默认 false */
  hideOnSinglePage?: boolean
  /** 小型分页器，默认 false */
  small?: boolean
  /** 静默埋点回调防侵入挂载点 */
  track?: TrackingFn
  /** 回退类其他任意 el-pagination 支持的属性 */
  [key: string]: any
}
