<script setup lang="ts">
import { computed } from 'vue'

/**
 * 枚举标签单元格渲染器。
 * 通过 typeOptions 传入字典映射，将原始值转换为带颜色的 el-tag。
 *
 * @example typeOptions: { '1': { text: '成功', type: 'success' }, '0': { text: '失败', type: 'danger' } }
 */
const props = defineProps<{
  /** 原始枚举值 */
  value: any
  /** 枚举字典映射 */
  options?: Record<string, { text: string; type?: string }>
}>()

/** 从字典中解析出当前值对应的配置 */
const tagConfig = computed(() => {
  if (!props.options || props.value == null) return null
  return props.options[String(props.value)] ?? null
})
</script>

<template>
  <el-tag
    v-if="tagConfig"
    :type="(tagConfig.type as any) ?? 'info'"
    size="small"
    disable-transitions
  >
    {{ tagConfig.text }}
  </el-tag>
  <span v-else class="star-cell-tag--fallback">{{ value ?? '-' }}</span>
</template>
