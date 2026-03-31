<script setup lang="ts">
import { StarTable, TableToolbar, useTableCore, useExport } from '@star-table/core'
import { ElMessage } from 'element-plus'
import { mockTableData, basicColumnsConfig, type UserRow } from './config'
import './style.scss'

// --- 1. 初始化状态引擎 ---
const {
  visibleColumns,
  columnStates,
  toggleColumnVisibility,
  pinColumn,
  reorderColumns,
  resetConfig
} = useTableCore<UserRow>({
  columns: basicColumnsConfig,
  cacheKey: 'demo-user-table-v5'
})

// --- 2. 事件处理 ---
const handleAction = (event: string, row: UserRow) => {
  ElMessage.success(`触发了 [${event}] 操作，操作行 ID: ${row.id}`)
}

const handleSelectionChange = (selection: UserRow[]) => {
  console.log('当前选中的行:', selection)
}

const handleFilterChange = (filters: Record<string, any[]>) => {
  console.log('表头过滤器变更:', filters)
  ElMessage.info(`过滤条件已变更: ${JSON.stringify(filters)}`)
}

const handleRefresh = () => {
  ElMessage.success('数据已刷新')
}

// --- 3. 导出 Excel ---
const { exportToExcel } = useExport()
const handleExport = () => {
  exportToExcel({
    columns: visibleColumns.value,
    data: mockTableData.value,
    filename: '用户列表导出'
  })
  ElMessage.success('Excel 导出成功')
}
</script>

<template>
  <div class="demo-container">
    <div class="header">
      <h2>基础组件演示</h2>
      <p class="subtitle">展示基础类型列、配置驱动操作按钮、本地持久化缓存、拖拽排序、高级过滤</p>
    </div>

    <el-card shadow="never" class="table-card">
      <!-- 工具栏：列设置 / 刷新 -->
      <TableToolbar
        :column-states="columnStates"
        @toggle-visibility="toggleColumnVisibility"
        @pin-column="pinColumn"
        @reorder="reorderColumns"
        @reset="resetConfig"
        @refresh="handleRefresh"
        @export="handleExport"
      >
        <template #left>
          <el-button type="primary" size="small">新增用户</el-button>
          <el-button size="small">批量导出</el-button>
        </template>
      </TableToolbar>

      <!-- 核心表格 -->
      <StarTable
        row-key="id"
        :data="mockTableData"
        :columns="visibleColumns"
        @action="handleAction"
        @selection-change="handleSelectionChange"
        @filter-change="handleFilterChange"
      >
        <!-- #expand 展开行插槽演示 -->
        <template #expand="{ row }">
          <div style="padding: 20px; background-color: var(--el-fill-color-light); border-radius: 4px; margin: 0 50px;">
            <h4>附加详细信息（仅供 expand 展开行使用）</h4>
            <p><strong>账号 ID:</strong> {{ row.id }}</p>
            <p><strong>近期明细:</strong> {{ row.details }}</p>
          </div>
        </template>
        <!-- #customAction 插槽覆盖演示 -->
        <template #customAction="{ row }">
          <el-button size="small" type="success" @click="ElMessage.warning(`通过插槽操作 ${row.name}`)">
            自定义插槽
          </el-button>
        </template>
      </StarTable>
    </el-card>
  </div>
</template>
