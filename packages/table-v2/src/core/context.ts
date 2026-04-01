import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'
import type { TableController } from '../types'

const TABLE_CONTEXT = Symbol('STAR_TABLE_V2_CONTEXT') as InjectionKey<TableController<any>>

export function provideTableContext<T>(table: TableController<T>) {
  provide(TABLE_CONTEXT, table)
}

export function useTableContext<T>() {
  const table = inject(TABLE_CONTEXT) as TableController<T> | undefined
  if (!table) {
    throw new Error(
      'Star Table v2 context is missing. Wrap child components with <StarTableRoot />.'
    )
  }
  return table
}
