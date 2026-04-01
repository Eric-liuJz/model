import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import StarTableRoot from '../src/components/StarTableRoot.vue'
import StarTableView from '../src/components/StarTableView.vue'
import { createStarTable } from '../src/core/createStarTable'
import { defineColumns, indexColumn, selectionColumn, textColumn } from '../src/schema'

interface UserRow {
  id: number
  name: string
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function flushView() {
  await flushPromises()
  await nextTick()
}

function createGlobalStubs(options?: { clearSelectionSpy?: ReturnType<typeof vi.fn> }) {
  const clearSelectionSpy = options?.clearSelectionSpy ?? vi.fn()

  return {
    'el-table': defineComponent({
      name: 'ElTable',
      template: '<div class="el-table-stub"><slot /></div>',
      props: ['data', 'rowKey', 'border'],
      methods: {
        clearSelection: clearSelectionSpy
      }
    }),
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
        'columnKey',
        'selectable'
      ]
    },
    'el-alert': {
      name: 'ElAlert',
      template: '<div class="el-alert-stub">{{ title }}</div>',
      props: ['title', 'type', 'showIcon', 'closable']
    },
    'el-button': {
      name: 'ElButton',
      template: '<button class="el-button-stub" @click="$emit(\'click\')"><slot /></button>',
      props: ['type', 'size']
    }
  }
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

const SlotHost = defineComponent({
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
      <StarTableView>
        <template #error="{ error }">
          <div class="custom-error-state">
            custom-error:{{ (error && error.message) || String(error) }}
          </div>
        </template>
        <template #overlay="{ isReloading }">
          <div class="custom-overlay-state">
            overlay:{{ isReloading ? 'on' : 'off' }}
          </div>
        </template>
      </StarTableView>
    </StarTableRoot>
  `
})

const OverlayHost = defineComponent({
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
      <StarTableView>
        <template #overlay="{ isReloading }">
          <div class="custom-overlay-state">
            overlay:{{ isReloading ? 'on' : 'off' }}
          </div>
        </template>
      </StarTableView>
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
        stubs: createGlobalStubs()
      }
    })

    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    expect(columns).toHaveLength(2)
    expect(columns[0].props('prop')).toBe('__index__')
    expect(columns[0].props('type')).toBeUndefined()
    expect(columns[1].props('sortable')).toBe('custom')
  })

  it('标准表格应当透传 selectable，并在 selection feature 关闭时隐藏勾选列', () => {
    const selectable = vi.fn((row: UserRow) => row.id === 1)
    const enabledTable = createStarTable<UserRow>({
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      rowKey: 'id',
      columns: defineColumns([
        selectionColumn({ selectable }),
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ]),
      features: {
        selection: true
      }
    })

    const enabledWrapper = mount(Host, {
      props: { table: enabledTable },
      global: {
        stubs: createGlobalStubs()
      }
    })

    const enabledColumns = enabledWrapper.findAllComponents({ name: 'ElTableColumn' })
    expect(enabledColumns[0].props('type')).toBe('selection')
    expect(enabledColumns[0].props('selectable')).toBe(selectable)

    const disabledTable = createStarTable<UserRow>({
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      rowKey: 'id',
      columns: defineColumns([
        selectionColumn(),
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ]),
      features: {
        selection: {
          enabled: false
        }
      }
    })

    const disabledWrapper = mount(Host, {
      props: { table: disabledTable },
      global: {
        stubs: createGlobalStubs()
      }
    })

    const disabledColumns = disabledWrapper.findAllComponents({ name: 'ElTableColumn' })
    expect(disabledColumns).toHaveLength(1)
    expect(disabledColumns[0].props('type')).toBeUndefined()
  })

  it('clearSelection 应当同步调用底层表格实例', async () => {
    const clearSelectionSpy = vi.fn()
    const table = createStarTable<UserRow>({
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      rowKey: 'id',
      columns: defineColumns([
        selectionColumn(),
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ]),
      features: {
        selection: true
      }
    })

    mount(Host, {
      props: { table },
      global: {
        stubs: createGlobalStubs({ clearSelectionSpy })
      }
    })

    table.actions.setSelection([{ id: 1, name: 'Alice' }])
    await nextTick()
    clearSelectionSpy.mockClear()

    table.actions.clearSelection()
    await nextTick()

    expect(clearSelectionSpy).toHaveBeenCalledTimes(1)
  })

  it('远程模式在首次加载时应展示默认 loading 态，并在空结果时切换为空态', async () => {
    const deferred = createDeferred<{ rows: UserRow[]; total: number }>()
    const table = createStarTable<UserRow>({
      getData: vi.fn(() => deferred.promise),
      rowKey: 'id',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ])
    })

    const wrapper = mount(Host, {
      props: { table },
      global: {
        stubs: createGlobalStubs()
      }
    })

    expect(wrapper.text()).toContain('正在加载数据')

    deferred.resolve({
      rows: [],
      total: 0
    })
    await flushView()

    expect(wrapper.text()).toContain('暂无数据')
    expect(wrapper.text()).toContain('当前筛选条件下没有可展示的结果')
  })

  it('远程模式支持自定义错误态插槽', async () => {
    const table = createStarTable<UserRow>({
      getData: vi.fn().mockRejectedValue(new Error('network failed')),
      rowKey: 'id',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ])
    })

    const wrapper = mount(SlotHost, {
      props: { table },
      global: {
        stubs: createGlobalStubs()
      }
    })

    await flushView()

    expect(wrapper.find('.custom-error-state').text()).toContain('custom-error:network failed')
  })

  it('远程模式支持自定义刷新遮罩插槽', async () => {
    const secondDeferred = createDeferred<{ rows: UserRow[]; total: number }>()
    const getData = vi
      .fn()
      .mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Alice' }],
        total: 1
      })
      .mockImplementationOnce(() => secondDeferred.promise)

    const table = createStarTable<UserRow>({
      getData,
      rowKey: 'id',
      columns: defineColumns([
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

    const wrapper = mount(OverlayHost, {
      props: { table },
      global: {
        stubs: createGlobalStubs()
      }
    })

    await flushView()

    table.actions.setSort({ columnKey: 'name', order: 'ascending' })
    await flushView()

    expect(wrapper.find('.custom-overlay-state').exists()).toBe(true)
    expect(wrapper.find('.custom-overlay-state').text()).toContain('overlay:on')

    secondDeferred.resolve({
      rows: [{ id: 2, name: 'Bob' }],
      total: 1
    })
    await flushView()
    expect(wrapper.find('.custom-overlay-state').exists()).toBe(false)
  })
})
