import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { createStarTable } from '../src/core/createStarTable'
import { defineColumns, textColumn } from '../src/schema'

interface UserRow {
  id: number
  name: string
  score: number
}

describe('createStarTable', () => {
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
})
