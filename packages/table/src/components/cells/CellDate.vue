<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'

/**
 * 日期格式化单元格渲染器。
 * 基于 dayjs 实现，通过 typeOptions.format 控制输出格式。
 */
const props = defineProps<{
  /** 原始时间值（时间戳、ISO 字符串等 dayjs 可解析的格式） */
  value: any
  /** 渲染器附加配置，支持 { format: string } */
  options?: Record<string, any>
}>()

/** 格式化后的时间文本 */
const formattedDate = computed(() => {
  if (!props.value) return '-'
  const parsed = dayjs(props.value)
  if (!parsed.isValid()) return String(props.value)
  return parsed.format(props.options?.format ?? 'YYYY-MM-DD HH:mm:ss')
})
</script>

<template>
  <span class="star-cell-date">{{ formattedDate }}</span>
</template>
