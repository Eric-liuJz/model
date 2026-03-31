<script setup lang="ts">
import { computed } from 'vue'
/**
 * 超链接单元格渲染器。
 * 通过 typeOptions 控制链接行为。
 *
 * @example typeOptions: { href: 'url_field', target: '_blank' }
 */
const props = defineProps<{
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

const href = computed(() => {
  const source = props.options?.href
  if (!source) return ''

  if (typeof source === 'function') {
    return String(source(props.row ?? {}) ?? '')
  }

  if (typeof source === 'string') {
    const maybeValue = props.row?.[source]
    return String(maybeValue ?? source ?? '')
  }

  return ''
})

const target = computed(() => String(props.options?.target ?? ''))
const rel = computed(() => (target.value === '_blank' ? 'noopener noreferrer' : undefined))

const handleClick = (event: MouseEvent) => {
  if (!href.value) {
    event.preventDefault()
    emit('click', props.row ?? {})
  }
}
</script>

<template>
  <el-link
    type="primary"
    :underline="false"
    :href="href || undefined"
    :target="target || undefined"
    :rel="rel"
    @click="handleClick"
  >
    {{ value ?? '-' }}
  </el-link>
</template>
