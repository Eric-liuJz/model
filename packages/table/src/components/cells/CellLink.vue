<script setup lang="ts">
/**
 * 超链接单元格渲染器。
 * 通过 typeOptions 控制链接行为。
 *
 * @example typeOptions: { href: 'url_field', target: '_blank' }
 */
defineProps<{
  /** 展示文本（通常为关联字段值） */
  value: any
  /** 链接行为配置 */
  options?: Record<string, any>
  /** 完整行数据（用于动态提取 href） */
  row?: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'click', row: Record<string, any>): void
}>()
</script>

<template>
  <el-link
    type="primary"
    :underline="false"
    @click="emit('click', row ?? {})"
  >
    {{ value ?? '-' }}
  </el-link>
</template>
