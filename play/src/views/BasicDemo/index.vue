<script setup lang="ts">
import { StarTable, useTableCore } from '@star-table/core'
import { ElMessage } from 'element-plus'
import { mockTableData, basicColumnsConfig, type UserRow } from './config'
import './style.scss'

// --- 1. 初始化状态引擎 ---
// 开启 cacheKey，尝试调整列的显隐，刷新页面查看持久化情况
const { visibleColumns, columnStates, toggleColumnVisibility } = useTableCore<UserRow>({
  columns: basicColumnsConfig,
  cacheKey: 'demo-user-table'
})

// --- 2. 事件处理 ---
const handleAction = (event: string, row: UserRow) => {
  ElMessage.success(`触发了 [${event}] 操作，操作行 ID: ${row.id}`)
}

const handleSelectionChange = (selection: UserRow[]) => {
  console.log('当前选中的行:', selection)
}

// 模拟业务侧控制列显隐
const toggleNameVisibility = (val: boolean | string | number) => {
  toggleColumnVisibility('name', !!val)
}
</script>

<template>
  <div class="demo-container">
    <div class="header">
      <h2>基础组件演示</h2>
      <p class="subtitle">展示基础类型列、配置驱动操作按钮、本地持久化缓存</p>
    </div>
    
    <div class="toolbar">
      <span>⚙️ 列控制:</span>
      <el-checkbox 
        :model-value="columnStates.find(c => c.prop === 'name')?.show ?? true" 
        @change="toggleNameVisibility"
      >
        显示「用户名」列 (可测试刷新页面持久化)
      </el-checkbox>
    </div>

    <el-card shadow="never" class="table-card">
      <StarTable
        row-key="id"
        :data="mockTableData"
        :columns="visibleColumns"
        @action="handleAction"
        @selection-change="handleSelectionChange"
      >
        <!-- #action 插槽覆盖演示 -->
        <template #customAction="{ row }">
          <el-button size="small" type="success" @click="ElMessage.warning(`通过插槽操作 ${row.name}`)">
            自定义插槽
          </el-button>
        </template>
      </StarTable>
    </el-card>
  </div>
</template>
