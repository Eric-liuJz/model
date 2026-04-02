<script setup lang="ts">
import { useSlots } from 'vue'
import type { TableViewStateSlotProps } from '../types'
import { useTableContext } from '../core/context'
import { useStarTableViewModel } from './useStarTableViewModel'

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
const {
  currentView,
  topbarVisible,
  footerVisible,
  viewState,
  surfaceStyle,
  sharedSlotProps,
  errorMessage
} = useStarTableViewModel(table, slots)
</script>

<template>
  <div class="star-table-v2-view" :class="{ 'is-fill': table.view.fill }">
    <div v-if="topbarVisible" class="star-table-v2-view__topbar">
      <div v-if="$slots.leftTop" class="star-table-v2-view__top-left">
        <slot name="leftTop" v-bind="sharedSlotProps" />
      </div>
      <div v-if="$slots.rightTop" class="star-table-v2-view__top-right">
        <slot name="rightTop" v-bind="sharedSlotProps" />
      </div>
    </div>

    <div class="star-table-v2-view__surface" :style="surfaceStyle">
      <div
        v-if="viewState.kind === 'loading' && viewState.presentation === 'state'"
        class="star-table-v2-view__state"
      >
        <slot name="loading" v-bind="sharedSlotProps">
          <div class="star-table-v2-view__loading">
            <div class="star-table-v2-view__spinner" />
            <div class="star-table-v2-view__loading-text">{{ table.view.loadingText }}</div>
          </div>
        </slot>
      </div>

      <div
        v-else-if="viewState.kind === 'error' && viewState.presentation === 'state'"
        class="star-table-v2-view__state"
      >
        <slot name="error" v-bind="sharedSlotProps">
          <div class="star-table-v2-view__panel is-error">
            <div class="star-table-v2-view__title">加载失败</div>
            <div class="star-table-v2-view__description">
              {{ errorMessage }}
            </div>
            <el-button type="primary" size="small" @click="sharedSlotProps.reload()">
              重新加载
            </el-button>
          </div>
        </slot>
      </div>

      <div v-else-if="viewState.kind === 'empty'" class="star-table-v2-view__state">
        <slot name="empty" v-bind="sharedSlotProps">
          <div class="star-table-v2-view__panel is-empty">
            <div class="star-table-v2-view__title">暂无数据</div>
            <div class="star-table-v2-view__description">当前筛选条件下没有可展示的结果。</div>
          </div>
        </slot>
      </div>

      <div v-else class="star-table-v2-view__content">
        <div
          v-if="viewState.kind === 'error' && viewState.presentation === 'inline'"
          class="star-table-v2-view__inline-error"
        >
          <slot name="error" v-bind="sharedSlotProps">
            <el-alert type="error" show-icon :closable="false" :title="errorMessage" />
          </slot>
        </div>

        <div class="star-table-v2-view__table-shell">
          <component :is="currentView" />

          <div
            v-if="viewState.kind === 'loading' && viewState.presentation === 'mask'"
            class="star-table-v2-view__mask"
          >
            <slot name="loading" v-bind="sharedSlotProps">
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
      <slot name="footer" v-bind="sharedSlotProps" />
    </div>
  </div>
</template>
