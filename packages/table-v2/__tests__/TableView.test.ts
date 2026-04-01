import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StarTableRoot from '../src/components/StarTableRoot.vue'
import StarTableView from '../src/components/StarTableView.vue'
import { createStarTable } from '../src/core/createStarTable'
import { defineColumns, indexColumn, textColumn } from '../src/schema'

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

describe('StarTableView', () => {
  it('当 controller 接管排序时应当把标准表格列标记为 custom 排序', () => {
    const table = createStarTable<UserRow>({
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      rowKey: 'id',
      columns: defineColumns([
        indexColumn({ title: '序号', width: 60 }),
        textColumn('name', {
          title: '姓名',
          accessor: 'name',
          sortable: true
        })
      ]),
      features: {
        sorting: true
      }
    })

    const wrapper = mount(Host, {
      props: { table },
      global: {
        stubs: {
          'el-table': {
            name: 'ElTable',
            template: '<div><slot /></div>',
            props: ['data', 'rowKey', 'border']
          },
          'el-table-column': {
            name: 'ElTableColumn',
            template: '<div></div>',
            props: [
              'type',
              'prop',
              'label',
              'width',
              'minWidth',
              'fixed',
              'align',
              'sortable',
              'className',
              'showOverflowTooltip',
              'columnKey'
            ]
          }
        }
      }
    })

    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    expect(columns).toHaveLength(2)
    expect(columns[0].props('prop')).toBe('__index__')
    expect(columns[0].props('type')).toBeUndefined()
    expect(columns[1].props('sortable')).toBe('custom')
  })
})
