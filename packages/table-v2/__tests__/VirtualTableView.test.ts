import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StarTableRoot from '../src/components/StarTableRoot.vue'
import StarTableView from '../src/components/StarTableView.vue'
import { createStarTable } from '../src/core/createStarTable'
import { defineColumns, textColumn } from '../src/schema'

interface UserRow {
  id: number
  name: string
}

const Host = defineComponent({
  props: {
    table: {
      type: Object,
      required: true
    }
  },
  components: {
    StarTableRoot,
    StarTableView
  },
  template: `
    <StarTableRoot :table="table">
      <StarTableView />
    </StarTableRoot>
  `
})

describe('VirtualTableView', () => {
  it('函数式 rowKey 在虚拟表格中应当被转换为稳定的内部字段', () => {
    const table = createStarTable<UserRow>({
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      rowKey: (row) => `user-${row.id}`,
      view: 'virtual',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name',
          renderCell: ({ row }) => `${row.name}:${row.id}`
        })
      ])
    })

    const wrapper = mount(Host, {
      props: { table },
      global: {
        stubs: {
          'el-auto-resizer': {
            name: 'ElAutoResizer',
            template: '<div><slot :width="960" :height="540" /></div>'
          },
          'el-table-v2': {
            name: 'ElTableV2',
            template: '<div></div>',
            props: ['columns', 'data', 'rowKey', 'width', 'height', 'fixed']
          }
        }
      }
    })

    const v2 = wrapper.findComponent({ name: 'ElTableV2' })
    const rows = v2.props('data') as Array<{ __starTableKey: string; __starTableRaw: UserRow }>
    const columns = v2.props('columns') as Array<{
      cellRenderer: (payload: {
        rowData: { __starTableKey: string; __starTableRaw: UserRow }
        rowIndex: number
      }) => unknown
    }>

    expect(v2.props('rowKey')).toBe('__starTableKey')
    expect(rows[0].__starTableKey).toBe('user-1')
    expect(rows[0].__starTableRaw).toEqual({ id: 1, name: 'Alice' })
    expect(columns[0].cellRenderer({ rowData: rows[0], rowIndex: 0 })).toBe('Alice:1')
  })
})
