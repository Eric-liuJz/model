import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StarVirtualTable from '../src/components/StarVirtualTable.vue'
import type { ColumnConfig } from '../src/types/column'
import { h } from 'vue'

describe('StarVirtualTable 虚拟表格构建引擎与代理桥接测试', () => {
  const dummyData = [
    { id: 1, name: 'Turing' },
    { id: 2, name: 'Hopper' }
  ]

  const globalConfig = {
    stubs: {
      'el-auto-resizer': {
        template: '<div><slot :width="1000" :height="1000" /></div>'
      },
      'el-table-v2': {
        name: 'ElTableV2',
        template: '<div></div>',
        props: ['columns', 'rowHeight', 'estimatedRowHeight']
      },
      'star-pagination': true
    }
  }

  it('应当剔出 type="expand" 的列，因虚拟树并不支持此特性', () => {
    const columns: ColumnConfig[] = [
      { prop: 'expand_col', type: 'expand', width: 50 },
      { prop: 'name', width: 100 }
    ]

    const wrapper = mount(StarVirtualTable, {
      props: {
        columns,
        data: dummyData
      },
      global: globalConfig
    })

    const elTableV2 = wrapper.findComponent({ name: 'ElTableV2' })
    expect(elTableV2.exists()).toBe(true)

    // 我们劫持传入底层的 v2Columns
    const passedV2Props = elTableV2.props('columns') as any[]

    // 只保留了 name 这个 column
    expect(passedV2Props.length).toBe(1)
    expect(passedV2Props[0].key).toBe('name')
  })

  it('宽度防错解析 (resolveWidth) 应当将基础配置转化为 px 数值', () => {
    const columns: ColumnConfig[] = [
      { prop: 'cb', type: 'selection' }, // 预期 50
      { prop: 'ix', type: 'index' }, // 预期 60
      { prop: 'sz1', width: '200px' }, // 预期 200
      { prop: 'sz2', minWidth: 300 } // 预期 300
    ]

    const wrapper = mount(StarVirtualTable, {
      props: { columns, data: [] },
      global: globalConfig
    })

    const passedV2Props = wrapper.findComponent({ name: 'ElTableV2' }).props('columns') as any[]

    expect(passedV2Props[0].width).toBe(50)
    expect(passedV2Props[1].width).toBe(60)
    expect(passedV2Props[2].width).toBe(200)
    expect(passedV2Props[3].width).toBe(300)
  })

  it('内部引擎应当桥接 rowHeight 与 estimatedRowHeight 的透明代理', () => {
    const wrapper = mount(StarVirtualTable, {
      props: {
        columns: [],
        data: [],
        rowHeight: 88,
        estimatedRowHeight: 44
      },
      global: globalConfig
    })

    const elTableV2 = wrapper.findComponent({ name: 'ElTableV2' })
    expect(elTableV2.props('rowHeight')).toBe(88)
    expect(elTableV2.props('estimatedRowHeight')).toBe(44)
  })

  it('单元格渲染分流引擎 (buildCellRenderer) 的优先级防渗漏', () => {
    const columns: ColumnConfig[] = [
      { prop: 'customFn', renderCell: (row) => h('span', row.name + '_fn') }
    ]

    const wrapper = mount(StarVirtualTable, {
      props: { columns, data: dummyData },
      global: globalConfig
    })

    const passedV2Props = wrapper.findComponent({ name: 'ElTableV2' }).props('columns') as any[]

    // 我们拿到底层收到的 cellRenderer 工厂函数
    const cellRenderer = passedV2Props[0].cellRenderer
    expect(typeof cellRenderer).toBe('function')

    // 虚拟调用执行 `el-table-v2` 会执行的那一段
    const vNodeResult = cellRenderer({ rowData: dummyData[0], rowIndex: 0 })

    // 由于不是 shallowMount，但没渲染 children，我们断言其 vnode 型态
    expect(vNodeResult.type).toBe('span')
    expect(vNodeResult.children).toBe('Turing_fn') // 自定义的 renderCell 正常映射成 vnode
  })
})
