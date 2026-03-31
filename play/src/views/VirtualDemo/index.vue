<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { StarVirtualTable, TableToolbar, useTableCore, useExport } from '@star-table/core'
import { ElMessage, ElTag, ElIcon } from 'element-plus'
import { StarFilled } from '@element-plus/icons-vue'
import type { ColumnConfig } from '@star-table/core'
import './style.scss'

// ========================================
// 1. 列配置定义（与 BasicDemo 完全同构的协议）
// ========================================
interface VirtualRow {
  id: number
  name: string
  department: string
  role: number
  status: string
  score: number
  joinDate: number
  email: string
}

const columnConfig: ColumnConfig<VirtualRow>[] = [
  { prop: 'id', label: 'ID', width: 80, align: 'center', fixed: 'left', sortable: true },
  {
    prop: 'name',
    label: '姓名',
    width: 140,
    fixed: 'left'
  },
  { prop: 'department', label: '部门', width: 140 },
  {
    prop: 'role',
    label: '角色',
    type: 'tag',
    width: 120,
    align: 'center',
    typeOptions: {
      '0': { text: '实习生', type: 'info' },
      '1': { text: '初级工程师', type: '' },
      '2': { text: '高级工程师', type: 'warning' },
      '3': { text: '技术专家', type: 'success' },
      '4': { text: '架构师', type: 'danger' }
    }
  },
  {
    prop: 'status',
    label: '状态',
    type: 'tag',
    width: 100,
    align: 'center',
    typeOptions: {
      active: { text: '在职', type: 'success' },
      leave: { text: '休假', type: 'warning' },
      resigned: { text: '离职', type: 'info' }
    }
  },
  {
    prop: 'score',
    label: '绩效',
    width: 120,
    align: 'center',
    renderHeader: () =>
      h(
        'div',
        { style: 'display:flex;align-items:center;justify-content:center;gap:4px;color:#e6a23c;' },
        [h(ElIcon, { size: 14 }, { default: () => h(StarFilled) }), h('span', '绩效')]
      ),
    renderCell: (row: VirtualRow) => {
      const type = row.score >= 90 ? 'success' : row.score >= 70 ? 'warning' : 'danger'
      return h(ElTag, { type, effect: 'dark', round: true, size: 'small' }, () => `${row.score} 分`)
    }
  },
  {
    prop: 'joinDate',
    label: '入职时间',
    type: 'date',
    width: 180,
    typeOptions: { format: 'YYYY-MM-DD' }
  },
  {
    prop: 'email',
    label: '工作邮箱',
    type: 'link',
    width: 260
  },
  {
    prop: 'action',
    type: 'action',
    label: '操作',
    width: 150,
    fixed: 'right',
    typeOptions: {
      actions: [
        { label: '查看', event: 'view', type: 'primary' },
        { label: '编辑', event: 'edit', type: 'warning' }
      ]
    }
  }
]

// ========================================
// 2. 生成 10 万行 Mock 数据
// ========================================
const TOTAL_ROWS = 100_000

const departments = [
  '研发中心',
  '产品设计',
  '运营推广',
  '市场拓展',
  '人力资源',
  '财务审计',
  '法务合规'
]
const statuses = ['active', 'leave', 'resigned'] as const
const firstNames = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴']
const lastNames = [
  '伟',
  '芳',
  '娜',
  '敏',
  '强',
  '磊',
  '洋',
  '勇',
  '艳',
  '杰',
  '军',
  '涛',
  '明',
  '静',
  '丽'
]

function generateMockData(count: number): VirtualRow[] {
  const now = Date.now()
  const rows: VirtualRow[] = []
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[i % lastNames.length]
    rows.push({
      id: i + 1,
      name: `${firstName}${lastName}`,
      department: departments[i % departments.length],
      role: i % 5,
      status: statuses[i % statuses.length],
      score: 40 + Math.floor(Math.random() * 61),
      joinDate: now - Math.floor(Math.random() * 5 * 365 * 86400000),
      email: `user${i + 1}@star-table.io`
    })
  }
  return rows
}

const mockData = ref(generateMockData(TOTAL_ROWS))

// --- 分页控制 ---
const currentPage = ref(1)
const pageSize = ref(100)
const displayData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return mockData.value.slice(start, start + pageSize.value)
})

// ========================================
// 3. 初始化状态引擎（复用同一个 useTableCore）
// ========================================
const {
  visibleColumns,
  columnStates,
  toggleColumnVisibility,
  pinColumn,
  reorderColumns,
  resetConfig
} = useTableCore<VirtualRow>({
  columns: columnConfig,
  cacheKey: 'demo-virtual-table-v1'
})

// ========================================
// 4. 事件处理
// ========================================
const handleAction = (event: string, row: VirtualRow) => {
  ElMessage.success(`触发了 [${event}] 操作，ID: ${row.id}，姓名: ${row.name}`)
}

const handleRefresh = () => {
  mockData.value = generateMockData(TOTAL_ROWS)
  ElMessage.success('数据已重新生成')
}

// 导出 Excel
const { exportToExcel } = useExport()
const handleExport = () => {
  exportToExcel({
    columns: visibleColumns.value,
    data: mockData.value.slice(0, 5000), // 为安全起见，导出前 5000 行
    filename: '虚拟表格前5000行导出'
  })
  ElMessage.success('已导出前 5000 行数据')
}

// 统计信息
const stats = computed(() => ({
  total: mockData.value.length.toLocaleString(),
  visibleCols: visibleColumns.value.length,
  totalCols: columnConfig.length
}))
</script>

<template>
  <div class="demo-container">
    <div class="header">
      <h2>虚拟列表（十万级数据）</h2>
      <p class="subtitle">
        基于 <code>el-table-v2</code> 与 <code>StarVirtualTable</code> 独立封装， 共享完全相同的
        <code>ColumnConfig</code> 协议 · 当前已加载 <strong>{{ stats.total }}</strong> 行， 显示
        <strong>{{ stats.visibleCols }}/{{ stats.totalCols }}</strong> 列
      </p>
    </div>

    <el-card shadow="never" class="table-card">
      <!-- 工具栏：与基础表格完全一致的 API -->
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
          <el-tag type="success" effect="plain" round> {{ stats.total }} 行已生成 </el-tag>
        </template>
      </TableToolbar>

      <!-- 核心虚拟表格 -->
      <StarVirtualTable
        row-key="id"
        :data="displayData"
        :columns="visibleColumns"
        :height="600"
        :pagination="{ pageSizes: [50, 100, 500, 1000] }"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="mockData.length"
        @action="handleAction"
      />
    </el-card>
  </div>
</template>
