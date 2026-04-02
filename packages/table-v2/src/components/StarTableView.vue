<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { TableViewStateSlotProps } from '../types'
import { useTableContext } from '../core/context'
import TableView from '../adapters/element-table/TableView.vue'
import VirtualTableView from '../adapters/element-table-v2/VirtualTableView.vue'

const table = useTableContext<any>()
const slots = useSlots()

defineSlots<{
  leftTop?: (props: TableViewStateSlotProps<any>) => any
  rightTop?: (props: TableViewStateSlotProps<any>) => any
  loading?: (props: TableViewStateSlotProps<any>) => any
  empty?: (props: TableViewStateSlotProps<any>) => any
  error?: (props: TableViewStateSlotProps<any>) => any
  footer?: (props: TableViewStateSlotProps<any>) => any
}>()

const currentView = computed(() => (table.view.isVirtual ? VirtualTableView : TableView))
const remote = computed(() => table.state.remote)
const loading = computed(() => remote.value?.loading.value ?? false)
const hasLoaded = computed(() => remote.value?.hasLoaded.value ?? false)
const isReloading = computed(() => remote.value?.isReloading.value ?? false)
const isEmpty = computed(() => remote.value?.isEmpty.value ?? false)
const error = computed(() => remote.value?.error.value ?? null)
const hasRows = computed(() => table.rows.value.length > 0)
const topbarVisible = computed(() => !!slots.leftTop || !!slots.rightTop)
const footerVisible = computed(() => !!slots.footer)

function normalizeLength(value: number | string) {
  return typeof value === 'number' ? `${value}px` : value
}

const surfaceStyle = computed(() => ({
  minHeight: normalizeLength(table.view.minHeight),
  height: table.view.fill ? '100%' : undefined
}))

function buildSlotProps(presentation: TableViewStateSlotProps<any>['presentation']) {
  const status = (remote.value?.status.value ?? 'local') as TableViewStateSlotProps<any>['status']

  return {
    table,
    remote: remote.value,
    status,
    loading: loading.value,
    hasLoaded: hasLoaded.value,
    hasRows: hasRows.value,
    isEmpty: isEmpty.value,
    isReloading: isReloading.value,
    error: error.value,
    presentation,
    reload: table.actions.reload
  }
}

const topSlotProps = computed<TableViewStateSlotProps<any>>(() => buildSlotProps('state'))
const loadingSlotProps = computed<TableViewStateSlotProps<any>>(() =>
  buildSlotProps(hasRows.value ? 'mask' : 'state')
)
const errorSlotProps = computed<TableViewStateSlotProps<any>>(() =>
  buildSlotProps(hasRows.value ? 'inline' : 'state')
)
const emptySlotProps = computed<TableViewStateSlotProps<any>>(() => buildSlotProps('state'))

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
const shouldShowInlineError = computed(() => !!remote.value && !!error.value && hasRows.value)
const shouldShowLoadingMask = computed(() => !!remote.value && loading.value && hasRows.value)
</script>

<template>
  <div class="star-table-v2-view" :class="{ 'is-fill': table.view.fill }">
    <div v-if="topbarVisible" class="star-table-v2-view__topbar">
      <div v-if="$slots.leftTop" class="star-table-v2-view__top-left">
        <slot name="leftTop" v-bind="topSlotProps" />
      </div>
      <div v-if="$slots.rightTop" class="star-table-v2-view__top-right">
        <slot name="rightTop" v-bind="topSlotProps" />
      </div>
    </div>

    <div class="star-table-v2-view__surface" :style="surfaceStyle">
      <div v-if="shouldShowLoadingState" class="star-table-v2-view__state">
        <slot name="loading" v-bind="loadingSlotProps">
          <div class="star-table-v2-view__loading">
            <div class="star-table-v2-view__spinner" />
            <div class="star-table-v2-view__loading-text">{{ table.view.loadingText }}</div>
          </div>
        </slot>
      </div>

      <div v-else-if="shouldShowErrorState" class="star-table-v2-view__state">
        <slot name="error" v-bind="errorSlotProps">
          <div class="star-table-v2-view__panel is-error">
            <div class="star-table-v2-view__title">加载失败</div>
            <div class="star-table-v2-view__description">
              {{ errorMessage }}
            </div>
            <el-button type="primary" size="small" @click="errorSlotProps.reload()">
              重新加载
            </el-button>
          </div>
        </slot>
      </div>

      <div v-else-if="shouldShowEmptyState" class="star-table-v2-view__state">
        <slot name="empty" v-bind="emptySlotProps">
          <div class="star-table-v2-view__panel is-empty">
            <div class="star-table-v2-view__title">暂无数据</div>
            <div class="star-table-v2-view__description">当前筛选条件下没有可展示的结果。</div>
          </div>
        </slot>
      </div>

      <div v-else class="star-table-v2-view__content">
        <div v-if="shouldShowInlineError" class="star-table-v2-view__inline-error">
          <slot name="error" v-bind="errorSlotProps">
            <el-alert type="error" show-icon :closable="false" :title="errorMessage" />
          </slot>
        </div>

        <div class="star-table-v2-view__table-shell">
          <component :is="currentView" />

          <div v-if="shouldShowLoadingMask" class="star-table-v2-view__mask">
            <slot name="loading" v-bind="loadingSlotProps">
              <div class="star-table-v2-view__loading star-table-v2-view__loading--mask">
                <div class="star-table-v2-view__spinner" />
                <div class="star-table-v2-view__loading-text">{{ table.view.loadingText }}</div>
              </div>
            </slot>
          </div>
        </div>
      </div>
    </div>

    <div v-if="footerVisible" class="star-table-v2-view__footer">
      <slot name="footer" v-bind="topSlotProps" />
    </div>
  </div>
</template>
