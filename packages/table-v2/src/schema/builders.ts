import type {
  ActionColumn,
  DateColumn,
  ExpandColumn,
  IndexColumn,
  LinkColumn,
  SelectionColumn,
  TableColumn,
  TagColumn,
  TextColumn
} from '../types'

type WithoutKindAndKey<T> = Omit<T, 'kind' | 'key'>

/**
 * 用于声明列数组，主要目的是帮助 TypeScript 更稳定地推导泛型。
 *
 * @example
 * ```ts
 * const columns = defineColumns<User>([
 *   textColumn('name', { title: '姓名', accessor: 'name' })
 * ])
 * ```
 */
export function defineColumns<T>(columns: TableColumn<T>[]) {
  return columns
}

/**
 * 创建文本列。
 */
export function textColumn<T>(
  key: string,
  config: WithoutKindAndKey<TextColumn<T>>
): TextColumn<T> {
  return { kind: 'text', key, ...config }
}

/**
 * 创建日期列。
 */
export function dateColumn<T>(
  key: string,
  config: WithoutKindAndKey<DateColumn<T>>
): DateColumn<T> {
  return { kind: 'date', key, ...config }
}

/**
 * 创建标签列。
 */
export function tagColumn<T>(key: string, config: WithoutKindAndKey<TagColumn<T>>): TagColumn<T> {
  return { kind: 'tag', key, ...config }
}

/**
 * 创建链接列。
 */
export function linkColumn<T>(
  key: string,
  config: WithoutKindAndKey<LinkColumn<T>>
): LinkColumn<T> {
  return { kind: 'link', key, ...config }
}

/**
 * 创建操作列。
 *
 * 如果没有显式传 `key`，默认使用 `'action'`。
 */
export function actionColumn<T>(
  config: Omit<ActionColumn<T>, 'kind' | 'key'> & { key?: string }
): ActionColumn<T> {
  const { key = 'action', ...rest } = config
  return { kind: 'action', key, ...rest }
}

/**
 * 创建勾选列。
 *
 * 如果没有显式传 `key`，默认使用内部保留值 `__selection__`。
 */
export function selectionColumn<T>(
  config: Omit<SelectionColumn<T>, 'kind' | 'key'> = {}
): SelectionColumn<T> {
  return { kind: 'selection', key: '__selection__', ...config }
}

/**
 * 创建序号列。
 *
 * 如果没有显式传 `key`，默认使用内部保留值 `__index__`。
 */
export function indexColumn<T>(config: Omit<IndexColumn<T>, 'kind' | 'key'> = {}): IndexColumn<T> {
  return { kind: 'index', key: '__index__', ...config }
}

/**
 * 创建展开列。
 *
 * 如果没有显式传 `key`，默认使用内部保留值 `__expand__`。
 */
export function expandColumn<T>(
  config: Omit<ExpandColumn<T>, 'kind' | 'key'> & { key?: string }
): ExpandColumn<T> {
  const { key = '__expand__', ...rest } = config
  return { kind: 'expand', key, ...rest }
}
