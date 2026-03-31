/**
 * @star-table/core 全局防侵入埋点字典 (Telemetry Events Dictionary)
 * 强类型定义用户在表格内的核心交互行为与携带参数结构
 */
export type TableTrackingPayloads = {
  /** 列拖拽换位 */
  'column-reorder': { prop: string; oldIndex: number; newIndex: number }
  /** 列显隐切换（从面板勾选） */
  'column-visibility': { prop: string; show: boolean }
  /** 列固定设置变更 */
  'column-pin': { prop: string; direction: 'left' | 'right' | false }
  /** 配置项重置 */
  'config-reset': Record<string, never> // 空对象
  /** 导出数据触发 */
  'export-trigger': { type: 'csv' | 'excel' | 'pdf'; filename: string | undefined }
  /** 分页-条数改变 */
  'pagination-size-change': { pageSize: number; currentPage: number }
  /** 分页-跳页 */
  'pagination-current-change': { currentPage: number; pageSize: number }
}

export type TableTrackingEventName = keyof TableTrackingPayloads

/**
 * 埋点核心执行回调的签名
 * 确保上报时载荷 (Payload) 类型必定能够精准匹配事件名称 (EventName)
 */
export type TrackingFn = <T extends TableTrackingEventName>(
  eventName: T,
  payload: TableTrackingPayloads[T]
) => void
