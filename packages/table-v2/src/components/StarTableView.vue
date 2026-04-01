<script setup lang="ts">
import { computed } from 'vue'
import type { TableViewStateSlotProps } from '../types'
import { useTableContext } from '../core/context'
import TableView from '../adapters/element-table/TableView.vue'
import VirtualTableView from '../adapters/element-table-v2/VirtualTableView.vue'

const table = useTableContext<any>()

defineSlots<{
  loading?: (props: TableViewStateSlotProps<any>) => any
  empty?: (props: TableViewStateSlotProps<any>) => any
  error?: (props: TableViewStateSlotProps<any>) => any
  overlay?: (props: TableViewStateSlotProps<any>) => any
  errorBanner?: (props: TableViewStateSlotProps<any>) => any
}>()

const currentView = computed(() => (table.view.isVirtual ? VirtualTableView : TableView))
const remote = computed(() => table.state.remote)
const loading = computed(() => remote.value?.loading.value ?? false)
const hasLoaded = computed(() => remote.value?.hasLoaded.value ?? false)
const isReloading = computed(() => remote.value?.isReloading.value ?? false)
const isEmpty = computed(() => remote.value?.isEmpty.value ?? false)
const error = computed(() => remote.value?.error.value ?? null)
const hasRows = computed(() => table.rows.value.length > 0)

const slotProps = computed<TableViewStateSlotProps<any>>(() => ({
  table,
  remote: remote.value,
  status: remote.value?.status.value ?? 'local',
  loading: loading.value,
  hasLoaded: hasLoaded.value,
  hasRows: hasRows.value,
  isEmpty: isEmpty.value,
  isReloading: isReloading.value,
  error: error.value,
  reload: table.actions.reload
}))

const errorMessage = computed(() => {
  if (error.value instanceof Error && error.value.message) {
    return error.value.message
  }

  if (typeof error.value === 'string' && error.value.trim()) {
    return error.value
  }

  return '请求未能成功完成，请稍后再试。'
})

// 状态展示只在远程模式下接管。
// 本地模式继续走底层 adapter，避免和业务已有空态逻辑冲突。
const shouldShowLoadingState = computed(() => !!remote.value && loading.value && !hasRows.value)
const shouldShowErrorState = computed(() => !!remote.value && !!error.value && !hasRows.value)
const shouldShowEmptyState = computed(
  () => !!remote.value && !loading.value && !error.value && isEmpty.value
)
const shouldShowErrorBanner = computed(() => !!remote.value && !!error.value && hasRows.value)
const shouldShowOverlay = computed(() => !!remote.value && loading.value && hasRows.value)
</script>

<template>
  <div class="star-table-v2-view">
    <div v-if="shouldShowErrorBanner" class="star-table-v2-view__banner">
      <slot name="errorBanner" v-bind="slotProps">
        <el-alert type="error" show-icon :closable="false" :title="errorMessage" />
      </slot>
    </div>

    <div class="star-table-v2-view__surface" :class="{ 'has-overlay': shouldShowOverlay }">
      <div v-if="shouldShowLoadingState" class="star-table-v2-view__state">
        <slot name="loading" v-bind="slotProps">
          <div class="star-table-v2-view__panel">
            <div class="star-table-v2-view__spinner" />
            <div class="star-table-v2-view__title">正在加载数据</div>
            <div class="star-table-v2-view__description">表格正在请求远程数据，请稍候。</div>
          </div>
        </slot>
      </div>

      <div v-else-if="shouldShowErrorState" class="star-table-v2-view__state">
        <slot name="error" v-bind="slotProps">
          <div class="star-table-v2-view__panel is-error">
            <div class="star-table-v2-view__title">加载失败</div>
            <div class="star-table-v2-view__description">
              {{ errorMessage }}
            </div>
            <el-button type="primary" size="small" @click="slotProps.reload()">
              重新加载
            </el-button>
          </div>
        </slot>
      </div>

      <div v-else-if="shouldShowEmptyState" class="star-table-v2-view__state">
        <slot name="empty" v-bind="slotProps">
          <div class="star-table-v2-view__panel is-empty">
            <div class="star-table-v2-view__title">暂无数据</div>
            <div class="star-table-v2-view__description">当前筛选条件下没有可展示的结果。</div>
          </div>
        </slot>
      </div>

      <div v-else class="star-table-v2-view__content">
        <component :is="currentView" />
      </div>

      <div v-if="shouldShowOverlay" class="star-table-v2-view__overlay">
        <slot name="overlay" v-bind="slotProps">
          <div class="star-table-v2-view__overlay-card">
            <div class="star-table-v2-view__spinner is-compact" />
            <span>刷新中，正在同步最新数据…</span>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>
