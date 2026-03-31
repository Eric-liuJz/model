import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StarTable from '../src/components/StarTable.vue'
import type { ColumnConfig } from '../src/types/column'

describe('StarTable', () => {
  const baseColumns: ColumnConfig[] = [{ prop: 'name', label: '姓名' }]
  const baseData = [{ id: 1, name: 'Alice' }]

  const globalStubs = {
    'el-table': {
      name: 'ElTable',
      template: '<div class="el-table"><slot /></div>',
      emits: ['sort-change', 'selection-change', 'filter-change']
    },
    'el-table-column': {
      name: 'ElTableColumn',
      template:
        '<div class="el-table-column"><slot name="header" /><slot :row="{ id: 1, name: \'Alice\' }" :$index="0" /></div>'
    },
    'el-tooltip': true,
    'el-icon': true,
    QuestionFilled: true,
    StarPagination: {
      name: 'StarPagination',
      template: '<div class="star-pagination-stub" @click="$emit(\'change\')" />',
      emits: ['change', 'update:currentPage', 'update:pageSize']
    }
  }

  it('应当透传 el-table 的 sort/selection/filter 事件', () => {
    const wrapper = mount(StarTable, {
      props: { columns: baseColumns, data: baseData },
      global: { stubs: globalStubs }
    })

    const table = wrapper.findComponent({ name: 'ElTable' })
    table.vm.$emit('sort-change', { prop: 'name', order: 'ascending' })
    table.vm.$emit('selection-change', [baseData[0]])
    table.vm.$emit('filter-change', { name: ['Alice'] })

    expect(wrapper.emitted('sort-change')?.[0]).toEqual([{ prop: 'name', order: 'ascending' }])
    expect(wrapper.emitted('selection-change')?.[0]).toEqual([[baseData[0]]])
    expect(wrapper.emitted('filter-change')?.[0]).toEqual([{ name: ['Alice'] }])
  })

  it('单元格渲染优先级应当是具名插槽高于 renderCell', () => {
    const wrapper = mount(StarTable, {
      props: {
        columns: [
          {
            prop: 'name',
            label: '姓名',
            renderCell: () => 'render-cell'
          }
        ],
        data: baseData
      },
      slots: {
        name: '<template #default="{ row }">slot-{{ row.name }}</template>'
      },
      global: { stubs: globalStubs }
    })

    expect(wrapper.text()).toContain('slot-Alice')
    expect(wrapper.text()).not.toContain('render-cell')
  })

  it('分页组件触发 change 时应当向外抛出 pagination-change', async () => {
    const wrapper = mount(StarTable, {
      props: {
        columns: baseColumns,
        data: baseData,
        pagination: true,
        total: 1
      },
      global: { stubs: globalStubs }
    })

    await wrapper.find('.star-pagination-stub').trigger('click')
    expect(wrapper.emitted('pagination-change')).toBeTruthy()
  })
})
