import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createStarTable } from '../src/core/createStarTable'
import { actionColumn, defineColumns, textColumn } from '../src/schema'

interface UserRow {
  id: number
  name: string
  score: number
}

async function flushRemoteTasks() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
}

async function waitForExpectation(assertion: () => void, retries = 12) {
  let lastError: unknown

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await flushRemoteTasks()
    }
  }

  throw lastError
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

describe('createStarTable', () => {
  it('应当把 view 配置归一化到 controller 上', () => {
    const table = createStarTable<UserRow>({
      data: [],
      rowKey: 'id',
      view: {
        mode: 'virtual',
        fill: false,
        minHeight: '420px',
        loadingText: '数据同步中'
      },
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ])
    })

    expect(table.view.mode).toBe('virtual')
    expect(table.view.isVirtual).toBe(true)
    expect(table.view.fill).toBe(false)
    expect(table.view.minHeight).toBe('420px')
    expect(table.view.loadingText).toBe('数据同步中')
  })

  it('应当始终以外部传入的数据源作为单一事实来源', () => {
    const source = ref<UserRow[]>([
      { id: 1, name: 'Alice', score: 30 },
      { id: 2, name: 'Bob', score: 80 }
    ])

    const table = createStarTable<UserRow>({
      data: source,
      rowKey: 'id',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ])
    })

    expect(table.data.value.map((row) => row.id)).toEqual([1, 2])
    expect('setData' in table.actions).toBe(false)

    source.value = [{ id: 3, name: 'Carol', score: 55 }]

    expect(table.data.value.map((row) => row.id)).toEqual([3])
    expect(table.allRows.value.map((row) => row.id)).toEqual([3])
    expect(table.rows.value.map((row) => row.id)).toEqual([3])
  })

  it('排序应当由 controller 基于列 accessor 统一计算', () => {
    const source = ref<UserRow[]>([
      { id: 1, name: 'Alice', score: 30 },
      { id: 2, name: 'Bob', score: 80 },
      { id: 3, name: 'Carol', score: 55 }
    ])

    const table = createStarTable<UserRow>({
      data: source,
      rowKey: 'id',
      columns: defineColumns([
        textColumn('score', {
          title: '分数',
          accessor: (row) => row.score,
          sortable: true
        })
      ]),
      features: {
        sorting: true
      }
    })

    table.actions.setSort({ columnKey: 'score', order: 'ascending' })
    expect(table.allRows.value.map((row) => row.id)).toEqual([1, 3, 2])

    table.actions.setSort({ columnKey: 'score', order: 'descending' })
    expect(table.allRows.value.map((row) => row.id)).toEqual([2, 3, 1])
  })

  it('列 key 重复时应当直接抛错，避免运行时身份冲突', () => {
    expect(() =>
      createStarTable<UserRow>({
        data: [],
        rowKey: 'id',
        columns: defineColumns([
          actionColumn<UserRow>({
            key: 'actions',
            title: '操作一',
            actions: []
          }),
          actionColumn<UserRow>({
            key: 'actions',
            title: '操作二',
            actions: []
          })
        ])
      })
    ).toThrow('Duplicate column key "actions"')
  })

  it('总数缩小时应当自动回收失效页码', async () => {
    const source = ref<UserRow[]>([
      { id: 1, name: 'Alice', score: 30 },
      { id: 2, name: 'Bob', score: 40 },
      { id: 3, name: 'Carol', score: 50 }
    ])

    const table = createStarTable<UserRow>({
      data: source,
      rowKey: 'id',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ]),
      features: {
        pagination: {
          page: 2,
          pageSize: 2
        }
      }
    })

    expect(table.state.pagination?.currentPage.value).toBe(2)
    expect(table.rows.value.map((row) => row.id)).toEqual([3])

    source.value = [{ id: 1, name: 'Alice', score: 30 }]
    await nextTick()

    expect(table.state.pagination?.currentPage.value).toBe(1)
    expect(table.rows.value.map((row) => row.id)).toEqual([1])
  })

  it('远程模式应当按统一参数协议调用 getData，并把结果注入 controller', async () => {
    const getData = vi.fn().mockResolvedValue({
      rows: [{ id: 101, name: 'Remote Alice', score: 88 }],
      total: 35
    })

    const table = createStarTable<UserRow>({
      getData,
      rowKey: 'id',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ]),
      features: {
        pagination: {
          pageSize: 20
        },
        sorting: true
      }
    })

    await waitForExpectation(() => {
      expect(getData).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        sort: {
          key: null,
          order: null
        },
        query: {}
      })
      expect(table.state.remote?.total.value).toBe(35)
      expect(table.rows.value.map((row) => row.id)).toEqual([101])
      expect(table.data.value.map((row) => row.id)).toEqual([101])
    })
  })

  it('远程导出默认应当关闭，只有显式声明 current scope 才可用', async () => {
    const remoteTable = createStarTable<UserRow>({
      getData: vi.fn().mockResolvedValue({
        rows: [{ id: 1, name: 'Alice', score: 30 }],
        total: 1
      }),
      rowKey: 'id',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ]),
      features: {
        pagination: true,
        export: {
          filename: 'remote-export'
        }
      }
    })

    await waitForExpectation(() => {
      expect(remoteTable.state.export?.available).toBe(false)
      expect(remoteTable.state.export?.scope).toBe('all')
    })

    const currentTable = createStarTable<UserRow>({
      getData: vi.fn().mockResolvedValue({
        rows: [{ id: 1, name: 'Alice', score: 30 }],
        total: 1
      }),
      rowKey: 'id',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ]),
      features: {
        pagination: true,
        export: {
          filename: 'remote-export-current',
          scope: 'current'
        }
      }
    })

    await waitForExpectation(() => {
      expect(currentTable.state.export?.available).toBe(true)
      expect(currentTable.state.export?.scope).toBe('current')
    })
  })

  it('远程模式应当在 query / sort / reload 时重新取数，并在 query 变化时重置到第一页', async () => {
    const query = ref<Record<string, unknown>>({
      keyword: '',
      status: 'all'
    })

    const getData = vi.fn().mockImplementation(async (params) => ({
      rows: [
        {
          id: Number(params.page),
          name: String(params.query.keyword || 'empty'),
          score: params.pageSize
        }
      ],
      total: 99
    }))

    const table = createStarTable<UserRow>({
      getData,
      query,
      rowKey: 'id',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ]),
      features: {
        pagination: {
          page: 3,
          pageSize: 5
        },
        sorting: true
      }
    })

    await waitForExpectation(() => {
      expect(getData).toHaveBeenLastCalledWith({
        page: 3,
        pageSize: 5,
        sort: {
          key: null,
          order: null
        },
        query: {
          keyword: '',
          status: 'all'
        }
      })
    })

    table.actions.setSort({ columnKey: 'name', order: 'ascending' })

    await waitForExpectation(() => {
      expect(getData).toHaveBeenLastCalledWith({
        page: 3,
        pageSize: 5,
        sort: {
          key: 'name',
          order: 'ascending'
        },
        query: {
          keyword: '',
          status: 'all'
        }
      })
    })

    query.value = {
      keyword: 'Bob',
      status: 'active'
    }
    await waitForExpectation(() => {
      expect(table.state.pagination?.currentPage.value).toBe(1)
      expect(getData).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 5,
        sort: {
          key: 'name',
          order: 'ascending'
        },
        query: {
          keyword: 'Bob',
          status: 'active'
        }
      })
    })

    await table.actions.reload()
    expect(getData).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 5,
      sort: {
        key: 'name',
        order: 'ascending'
      },
      query: {
        keyword: 'Bob',
        status: 'active'
      }
    })
  })

  it('远程模式应当暴露完整状态机，并在 keepPreviousData=false 时先清空旧数据', async () => {
    const firstDeferred = createDeferred<{ rows: UserRow[]; total: number }>()
    const secondDeferred = createDeferred<{ rows: UserRow[]; total: number }>()
    const getData = vi
      .fn()
      .mockImplementationOnce(() => firstDeferred.promise)
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
      },
      remote: {
        keepPreviousData: false
      }
    })

    expect(table.state.remote?.status.value).toBe('loading')
    expect(table.state.remote?.loading.value).toBe(true)
    expect(table.state.remote?.hasLoaded.value).toBe(false)
    expect(table.state.remote?.rows.value).toEqual([])

    firstDeferred.resolve({
      rows: [{ id: 1, name: 'Alice', score: 30 }],
      total: 1
    })
    await flushRemoteTasks()

    await waitForExpectation(() => {
      expect(table.state.remote?.status.value).toBe('success')
      expect(table.state.remote?.loading.value).toBe(false)
      expect(table.state.remote?.hasLoaded.value).toBe(true)
      expect(table.state.remote?.isReloading.value).toBe(false)
      expect(table.rows.value.map((row) => row.id)).toEqual([1])
    })

    table.actions.setSort({ columnKey: 'name', order: 'ascending' })
    await flushRemoteTasks()

    expect(table.state.remote?.status.value).toBe('loading')
    expect(table.state.remote?.isReloading.value).toBe(true)
    expect(table.state.remote?.rows.value).toEqual([])

    secondDeferred.resolve({
      rows: [],
      total: 0
    })

    await waitForExpectation(() => {
      expect(table.state.remote?.status.value).toBe('success')
      expect(table.state.remote?.isEmpty.value).toBe(true)
    })
  })

  it('远程模式应当按顺序触发生命周期钩子，并在失败时更新 error 状态', async () => {
    const events: string[] = []
    const getData = vi
      .fn()
      .mockResolvedValueOnce({
        rows: [{ id: 9, name: 'Hooked', score: 90 }],
        total: 1
      })
      .mockRejectedValueOnce(new Error('network failed'))

    const onBeforeLoad = vi.fn((params) => {
      events.push(`before:${params.page}`)
    })
    const onLoadSuccess = vi.fn((result, params, context) => {
      events.push(`success:${params.page}:${result.rows.length}:${context.status}`)
    })
    const onLoadError = vi.fn((error, params, context) => {
      events.push(`error:${params.page}:${(error as Error).message}:${context.status}`)
    })
    const onLoadFinally = vi.fn((context) => {
      events.push(`finally:${context.params.page}:${context.status}`)
    })

    const table = createStarTable<UserRow>({
      getData,
      rowKey: 'id',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ]),
      remote: {
        onBeforeLoad,
        onLoadSuccess,
        onLoadError,
        onLoadFinally
      }
    })

    await waitForExpectation(() => {
      expect(onBeforeLoad).toHaveBeenCalledTimes(1)
      expect(onLoadSuccess).toHaveBeenCalledTimes(1)
      expect(onLoadError).not.toHaveBeenCalled()
      expect(onLoadFinally).toHaveBeenCalledTimes(1)
      expect(events).toEqual(['before:1', 'success:1:1:success', 'finally:1:success'])
    })

    await table.actions.reload()

    expect(table.state.remote?.status.value).toBe('error')
    expect(table.state.remote?.error.value).toBeInstanceOf(Error)
    expect(onLoadError).toHaveBeenCalledTimes(1)
    expect(onLoadFinally).toHaveBeenCalledTimes(2)
    expect(events.slice(-3)).toEqual([
      'before:1',
      'error:1:network failed:error',
      'finally:1:error'
    ])
  })

  it('远程生命周期钩子抛错时不应影响主请求结果', async () => {
    const getData = vi.fn().mockResolvedValue({
      rows: [{ id: 7, name: 'Stable', score: 77 }],
      total: 1
    })

    const table = createStarTable<UserRow>({
      getData,
      rowKey: 'id',
      columns: defineColumns([
        textColumn('name', {
          title: '姓名',
          accessor: 'name'
        })
      ]),
      remote: {
        onLoadSuccess() {
          throw new Error('telemetry failed')
        }
      }
    })

    await waitForExpectation(() => {
      expect(table.state.remote?.status.value).toBe('success')
      expect(table.rows.value.map((row) => row.id)).toEqual([7])
      expect(table.state.remote?.error.value).toBe(null)
    })
  })
})
