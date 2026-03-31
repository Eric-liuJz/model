import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useTableCore } from '../src/hooks/useTableCore'
import type { ColumnConfig } from '../src/types/column'
import type { TableOptions } from '../src/types/table'

/** 测试用模拟数据结构 */
interface MockRow {
  id: number
  name: string
  status: number
  createTime: string
}

/** 标准测试列配置 */
const createMockColumns = (): ColumnConfig<MockRow>[] => [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称', minWidth: 120 },
  { prop: 'status', label: '状态', type: 'tag', typeOptions: { '1': { text: '成功', type: 'success' } } },
  { prop: 'createTime', label: '创建时间', type: 'date', show: false },
  { prop: 'action', label: '操作', type: 'action', fixed: 'right', width: 150 },
]

describe('useTableCore', () => {

  it('应当正确初始化 columnStates', () => {
    const columns = createMockColumns()
    const { columnStates } = useTableCore<MockRow>({ columns })

    expect(columnStates.value).toHaveLength(5)
    expect(columnStates.value[0]).toEqual({
      prop: 'id', show: true, fixed: false, width: 80
    })
    // createTime 列初始设定 show: false
    expect(columnStates.value[3].show).toBe(false)
    // action 列初始设定 fixed: 'right'
    expect(columnStates.value[4].fixed).toBe('right')
  })

  it('visibleColumns 应当过滤掉 show: false 的列', () => {
    const columns = createMockColumns()
    const { visibleColumns } = useTableCore<MockRow>({ columns })

    // createTime 的 show 为 false，应被过滤
    expect(visibleColumns.value).toHaveLength(4)
    const props = visibleColumns.value.map(c => c.prop)
    expect(props).not.toContain('createTime')
    expect(props).toContain('id')
    expect(props).toContain('action')
  })

  it('visibleColumns 应当保留原始配置中的非状态属性', () => {
    const columns = createMockColumns()
    const { visibleColumns } = useTableCore<MockRow>({ columns })

    const statusCol = visibleColumns.value.find(c => c.prop === 'status')
    expect(statusCol).toBeDefined()
    expect(statusCol!.type).toBe('tag')
    expect(statusCol!.typeOptions).toEqual({ '1': { text: '成功', type: 'success' } })
  })

  it('toggleColumnVisibility 应当正确切换列可见性', async () => {
    const columns = createMockColumns()
    const { visibleColumns, toggleColumnVisibility } = useTableCore<MockRow>({ columns })

    // 隐藏 name 列
    toggleColumnVisibility('name', false)
    await nextTick()

    expect(visibleColumns.value.find(c => c.prop === 'name')).toBeUndefined()
    expect(visibleColumns.value).toHaveLength(3)

    // 显示 createTime 列
    toggleColumnVisibility('createTime', true)
    await nextTick()

    expect(visibleColumns.value.find(c => c.prop === 'createTime')).toBeDefined()
    expect(visibleColumns.value).toHaveLength(4)
  })

  it('pinColumn 应当正确修改列的固定方向', async () => {
    const columns = createMockColumns()
    const { visibleColumns, pinColumn } = useTableCore<MockRow>({ columns })

    // 将 name 列固定到左侧
    pinColumn('name', 'left')
    await nextTick()

    const nameCol = visibleColumns.value.find(c => c.prop === 'name')
    expect(nameCol!.fixed).toBe('left')

    // 解除固定
    pinColumn('name', false)
    await nextTick()

    const nameCol2 = visibleColumns.value.find(c => c.prop === 'name')
    expect(nameCol2!.fixed).toBe(false)
  })

  it('resetConfig 应当回溯至初始状态', async () => {
    const columns = createMockColumns()
    const { visibleColumns, toggleColumnVisibility, pinColumn, resetConfig } = useTableCore<MockRow>({ columns })

    // 做一些修改
    toggleColumnVisibility('id', false)
    pinColumn('name', 'right')
    await nextTick()

    expect(visibleColumns.value.find(c => c.prop === 'id')).toBeUndefined()
    expect(visibleColumns.value.find(c => c.prop === 'name')!.fixed).toBe('right')

    // 重置
    resetConfig()
    await nextTick()

    expect(visibleColumns.value).toHaveLength(4) // createTime 初始就是 false
    expect(visibleColumns.value.find(c => c.prop === 'id')).toBeDefined()
    expect(visibleColumns.value.find(c => c.prop === 'name')!.fixed).toBe(false)
  })

  it('对不存在的 prop 调用操作方法时应当静默不报错', () => {
    const columns = createMockColumns()
    const { toggleColumnVisibility, pinColumn } = useTableCore<MockRow>({ columns })

    expect(() => toggleColumnVisibility('nonexistent', true)).not.toThrow()
    expect(() => pinColumn('nonexistent', 'left')).not.toThrow()
  })
})
