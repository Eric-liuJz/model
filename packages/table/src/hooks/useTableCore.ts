import { ref, computed, unref, type Ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { TableOptions } from '../types/table'
import type { ColumnConfig, ColumnState } from '../types/column'

/**
 * 表格核心状态派生引擎。
 *
 * 职责边界：
 * - 接收不可变的原始列配置，派生出响应式的可见列状态流
 * - 提供列显隐、固定方向等交互行为的合法干预信道
 * - 在装载 cacheKey 时自动与 LocalStorage 建立双向同步
 *
 * @template T - 业务行数据的泛型结构
 * @param options - 组件核心数据注入参数
 */
export function useTableCore<T>(options: TableOptions<T>) {
  const { columns, cacheKey } = options

  // ==========================================
  // 1. 初始状态快照 (Initial State Snapshot)
  // ==========================================

  /** 从不可变的原始配置中提取初始瞬态属性 */
  const initStates: ColumnState[] = columns.map(col => ({
    prop: String(col.prop),
    show: col.show ?? true,
    fixed: col.fixed ?? false,
    width: col.width
  }))

  // ==========================================
  // 2. 响应式状态容器 (Reactive State Container)
  // ==========================================

  /**
   * 列瞬态属性的响应式存储。
   * 当提供 cacheKey 时，自动委托 @vueuse/core 的 useLocalStorage
   * 实现跨会话持久化；否则退化为普通 ref。
   */
  const columnStates: Ref<ColumnState[]> = cacheKey
    ? useLocalStorage<ColumnState[]>(`star-table-${cacheKey}`, initStates.map(s => ({ ...s })))
    : ref<ColumnState[]>(initStates.map(s => ({ ...s })))

  // 缓存校对：处理配置增删字段导致与缓存不一致的问题
  if (cacheKey) {
    const cached = columnStates.value
    const newStates: ColumnState[] = []
    
    // 1. 保留缓存中仍然存在于最新配置中的列（维持用户可能拖拽的顺序）
    cached.forEach(s => {
      if (columns.some(c => String(c.prop) === s.prop)) {
        newStates.push(s)
      }
    })
    
    // 2. 将配置中新增的列追加进去（避免新加的列无法显示）
    columns.forEach(col => {
      if (!newStates.some(s => s.prop === String(col.prop))) {
        const init = initStates.find(s => s.prop === String(col.prop))
        if (init) newStates.push({ ...init })
      }
    })

    // 3. 更新为校验后的状态
    columnStates.value = newStates
  }

  // ==========================================
  // 3. 只读数据流出口 (Read-Only Data Stream)
  // ==========================================

  /**
   * 经过状态引擎计算后的最终可见列配置。
   * 合并了不可变的原始骨架与实时的瞬态属性，过滤了不可见列。
   * 此为下游渲染层唯一合法的数据消费源。
   */
  const visibleColumns = computed<ColumnConfig<T>[]>(() => {
    return columnStates.value
      .filter(state => state.show)
      .map(state => {
        const rawCol = columns.find(c => String(c.prop) === state.prop)
        if (!rawCol) return null
        return {
          ...rawCol,
          show: state.show,
          fixed: state.fixed,
          width: state.width ?? rawCol.width
        } as ColumnConfig<T>
      })
      .filter((col): col is ColumnConfig<T> => col !== null)
  })

  // ==========================================
  // 4. 状态干预信道 (State Mutation Channels)
  // ==========================================

  /**
   * 切换指定列的可见性状态。
   *
   * @param prop   - 目标列的 prop 标识
   * @param isShow - 期望的可见性状态
   */
  const toggleColumnVisibility = (prop: string, isShow: boolean): void => {
    const state = columnStates.value.find(s => s.prop === prop)
    if (state) state.show = isShow
  }

  /**
   * 干预指定列的视窗边缘固定策略。
   * 当 direction 为 false 时解除固定。
   *
   * @param prop      - 目标列的 prop 标识
   * @param direction - 固定方向或解除固定
   */
  const pinColumn = (prop: string, direction: 'left' | 'right' | false): void => {
    const state = columnStates.value.find(s => s.prop === prop)
    if (state) state.fixed = direction
  }

  /**
   * 列排序换位操作。
   * 接收 SortableJS 等拖拽库输出的起止下标，对 columnStates 数组执行元素平移。
   *
   * @param oldIndex - 拖拽起始位置
   * @param newIndex - 拖拽目标位置
   */
  const reorderColumns = (oldIndex: number, newIndex: number): void => {
    const list = [...columnStates.value]
    const [moved] = list.splice(oldIndex, 1)
    list.splice(newIndex, 0, moved)
    columnStates.value = list
  }

  /**
   * 回溯至初始状态快照。
   * 擦除所有用户交互产生的偏移记录，包括本地持久层的缓存数据。
   */
  const resetConfig = (): void => {
    columnStates.value = initStates.map(s => ({ ...s }))
  }

  // ==========================================
  // 5. 引擎出口 (Engine Exports)
  // ==========================================

  return {
    /** 只读：经过引擎计算的可见列配置流 */
    visibleColumns,
    /** 只读：列瞬态属性的完整响应式引用（供设置面板等场景消费） */
    columnStates,
    /** 干预：切换列可见性 */
    toggleColumnVisibility,
    /** 干预：设置列固定方向 */
    pinColumn,
    /** 干预：列顺序换位 */
    reorderColumns,
    /** 清理：重置至初始状态 */
    resetConfig
  }
}
