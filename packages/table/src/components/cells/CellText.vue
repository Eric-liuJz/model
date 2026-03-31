<script setup lang="ts">
/**
 * 默认文本单元格渲染器。
 * 当 ColumnConfig.type 未指定或为 'text' 时装载。
 */
defineProps<{
  /** 单元格绑定值 */
  value: any
  /** 渲染器附加配置（文本类型暂无额外配置） */
  options?: Record<string, any>
}>()
</script>

<template>
  <span class="star-cell-text">{{ value ?? '-' }}</span>
</template>
