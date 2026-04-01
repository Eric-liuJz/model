import { h } from 'vue'
import { ElButton, ElPopconfirm, ElSpace } from 'element-plus'
import type { TableActionItem } from '../types'

function createActionButton<T>(action: TableActionItem<T>, row: T, onClick: () => void) {
  return h(
    ElButton,
    {
      size: 'small',
      type: action.type === 'default' ? undefined : action.type,
      disabled: action.disabled?.(row) ?? false,
      onClick: action.confirm ? undefined : onClick
    },
    () => action.label
  )
}

export function renderActionCell<T>(
  actions: TableActionItem<T>[],
  row: T,
  onAction: (actionKey: string) => void
) {
  const nodes = actions
    .filter((action) => action.visible?.(row) ?? true)
    .map((action) => {
      const button = createActionButton(action, row, () => onAction(action.key))
      if (!action.confirm) return button

      return h(
        ElPopconfirm,
        {
          title: action.confirm,
          onConfirm: () => onAction(action.key)
        },
        {
          reference: () => button
        }
      )
    })

  return h(ElSpace, { size: 8, wrap: true }, () => nodes)
}
