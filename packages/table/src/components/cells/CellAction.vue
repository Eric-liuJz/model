<script setup lang="ts">
import { computed } from 'vue'
import type { ActionItem } from '../../types/column'

/**
 * 操作列单元格渲染器。
 *
 * 设计策略（方案 C：配置驱动 + 插槽逃生）：
 * - 默认根据 typeOptions.actions 配置自动渲染按钮组
 * - 含 confirm 字段的按钮自动挂载 el-popconfirm 二次确认
 * - 含 visible 函数的按钮支持按行动态显隐
 * - 当外层提供 #action 插槽时，配置让位，完全由业务接管
 */
const props = defineProps<{
  /** 当前行数据 */
  row: Record<string, any>
  /** 行索引 */
  index: number
  /** 渲染器附加配置，预期包含 actions: ActionItem[] */
  options?: { actions?: ActionItem[]; [key: string]: any }
}>()

const emit = defineEmits<{
  (e: 'action', event: string, row: Record<string, any>, index: number): void
}>()

/** 经过 visible 过滤后的可见按钮列表 */
const visibleActions = computed<ActionItem[]>(() => {
  const actions = props.options?.actions ?? []
  return actions.filter(action =>
    action.visible ? action.visible(props.row) : true
  )
})

/** 触发操作事件 */
const handleAction = (event: string) => {
  emit('action', event, props.row, props.index)
}
</script>

<template>
  <div class="star-cell-action">
    <template v-for="action in visibleActions" :key="action.event">
      <!-- 带二次确认的按钮 -->
      <el-popconfirm
        v-if="action.confirm"
        :title="action.confirm"
        @confirm="handleAction(action.event)"
      >
        <template #reference>
          <el-button
            :type="action.type ?? 'default'"
            link
            size="small"
          >
            {{ action.label }}
          </el-button>
        </template>
      </el-popconfirm>
      <!-- 普通按钮 -->
      <el-button
        v-else
        :type="action.type ?? 'default'"
        link
        size="small"
        @click="handleAction(action.event)"
      >
        {{ action.label }}
      </el-button>
    </template>
  </div>
</template>
