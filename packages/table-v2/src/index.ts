export { createStarTable } from './core/createStarTable'
export { useTableContext } from './core/context'

export { default as StarTableRoot } from './components/StarTableRoot.vue'
export { default as StarTableView } from './components/StarTableView.vue'
export { default as StarTableToolbar } from './features/column-settings/Toolbar.vue'
export { default as StarTablePagination } from './features/pagination/Pagination.vue'

export {
  defineColumns,
  textColumn,
  dateColumn,
  tagColumn,
  linkColumn,
  actionColumn,
  selectionColumn,
  indexColumn,
  expandColumn
} from './schema'

export * from './types'
