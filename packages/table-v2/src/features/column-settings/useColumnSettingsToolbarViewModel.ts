import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Sortable from 'sortablejs'
import type { TableController } from '../../types'

export const COLUMN_FIXED_OPTIONS = [
  { label: '自由布局', value: false },
  { label: '左侧固定', value: 'left' },
  { label: '右侧固定', value: 'right' }
] as const

export function useColumnSettingsToolbarViewModel<T>(table: TableController<T>) {
  const drawerVisible = ref(false)
  const states = table.state.columnSettings?.columns
  const exportState = computed(() => table.state.export)
  const visibleCount = computed(() => states?.value.filter((column) => column.visible).length ?? 0)
  const sortableListRef = ref<HTMLElement | null>(null)
  const isSorting = ref(false)
  let sortableInstance: Sortable | null = null

  function initSortable() {
    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
    }

    const element = sortableListRef.value
    if (!element) return

    sortableInstance = Sortable.create(element, {
      animation: 150,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      handle: '.drag-handle',
      ghostClass: 'column-setting-ghost',
      chosenClass: 'column-setting-chosen',
      dragClass: 'column-setting-dragging',
      fallbackTolerance: 4,
      onStart: () => {
        isSorting.value = true
      },
      onEnd: ({ oldIndex, newIndex }) => {
        isSorting.value = false
        if (oldIndex == null || newIndex == null || oldIndex === newIndex) return
        table.actions.reorderColumn(oldIndex, newIndex)
      },
      onSort: () => {
        isSorting.value = true
      }
    })
  }

  watch(drawerVisible, async (visible) => {
    if (!visible) return
    await nextTick()
    initSortable()
  })

  onBeforeUnmount(() => {
    sortableInstance?.destroy()
  })

  return {
    drawerVisible,
    states,
    exportState,
    visibleCount,
    sortableListRef,
    isSorting,
    fixedOptions: COLUMN_FIXED_OPTIONS
  }
}
