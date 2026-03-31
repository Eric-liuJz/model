<script setup lang="ts">
import { toRef } from 'vue'
import type { PaginationConfig } from '../types/pagination'
import { usePagination } from '../hooks'

/**
 * StarPagination 核心分页组件。
 *
 * 职责梳理 (Hooks + 独立 UI 原则)：
 * - 剥离出所有的双向绑定控制权
 * - 剥离出默认配置聚合计算 (UI 逻辑)
 * - 净化外层 StarTable 的代码维度
 */

const props = defineProps<{
  /** 外部传入的分页配置 (如果是 false 级相当于根本不会被渲染) */
  config: boolean | PaginationConfig
  /** 数据总条数 */
  total: number
}>()

const emit = defineEmits<{
  (e: 'change'): void
}>()

// 受控的双向绑定：与 Vue 3.4 规范一致，让调用方随意拦截
const currentPage = defineModel<number>('currentPage', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 20 })

// 通过 Hooks 接管 UI 配置状态，保持 UI 层纯粹
const { mergedConfig } = usePagination(toRef(props, 'config'))

// 当翻页或变尺寸时，只单纯向上抛出通知，父组件想拦截就拦截
const handleChange = () => {
  emit('change')
}
</script>

<template>
  <div v-if="mergedConfig" class="star-table-pagination-wrapper">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :layout="mergedConfig.layout"
      :background="mergedConfig.background"
      :page-sizes="mergedConfig.pageSizes"
      :hide-on-single-page="mergedConfig.hideOnSinglePage"
      :small="mergedConfig.small"
      v-bind="mergedConfig"
      @size-change="handleChange"
      @current-change="handleChange"
    />
  </div>
</template>
