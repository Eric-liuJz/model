<script setup lang="ts">
import { computed, h, onBeforeUnmount, ref } from 'vue'
import {
  StarTablePagination,
  StarTableRoot,
  StarTableToolbar,
  StarTableView,
  actionColumn,
  createStarTable,
  defineColumns,
  indexColumn,
  linkColumn,
  selectionColumn,
  tagColumn,
  textColumn,
  dateColumn
} from '@star-table/table-v2'
import { ElButton, ElMessage, ElTag } from 'element-plus'

interface UserRow {
  id: number
  name: string
  status: 'active' | 'reviewing' | 'blocked'
  role: string
  createdAt: number
  homepage: string
}

function generateUsers(count: number): UserRow[] {
  const now = Date.now()
  const statuses: UserRow['status'][] = ['active', 'reviewing', 'blocked']
  const roles = ['研发工程师', '产品经理', '设计师', '测试工程师']

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `成员 ${index + 1}`,
    status: statuses[index % statuses.length],
    role: roles[index % roles.length],
    createdAt: now - index * 86400000,
    homepage: `https://star-table.dev/users/${index + 1}`
  }))
}

const users = ref(generateUsers(128))
const featureTags = ['选择', '排序', '分页', '列设置', '导出', '固定列', '自定义渲染']

const columns = defineColumns<UserRow>([
  selectionColumn({ fixed: 'left', width: 55 }),
  indexColumn({ title: '序号', width: 70, fixed: 'left' }),
  textColumn('name', {
    title: '成员名称',
    accessor: 'name',
    minWidth: 180,
    overflowTooltip: true
  }),
  tagColumn('status', {
    title: '状态',
    accessor: 'status',
    width: 120,
    align: 'center',
    resolveTag: ({ value }) => {
      const map = {
        active: { label: '正常', type: 'success' as const },
        reviewing: { label: '审核中', type: 'warning' as const },
        blocked: { label: '受限', type: 'danger' as const }
      }
      return map[String(value) as UserRow['status']]
    }
  }),
  textColumn('role', {
    title: '角色',
    accessor: 'role',
    width: 160,
    renderCell: ({ value }) =>
      h(
        ElTag,
        {
          effect: 'plain',
          round: true
        },
        () => String(value ?? '')
      )
  }),
  dateColumn('createdAt', {
    title: '创建时间',
    accessor: 'createdAt',
    width: 180,
    sortable: true,
    format: 'YYYY-MM-DD'
  }),
  linkColumn('homepage', {
    title: '主页',
    accessor: 'homepage',
    minWidth: 260,
    text: ({ row }) => `${row.name} 的主页`
  }),
  actionColumn<UserRow>({
    key: 'actions',
    title: '操作',
    width: 180,
    fixed: 'right',
    actions: [
      { key: 'view', label: '查看', type: 'primary' },
      { key: 'archive', label: '归档', type: 'warning', confirm: '确认归档这条记录？' }
    ]
  })
])

const table = createStarTable<UserRow>({
  data: users,
  columns,
  rowKey: 'id',
  features: {
    pagination: {
      pageSize: 10,
      pageSizes: [10, 20, 50]
    },
    columnSettings: {
      cacheKey: 'play-table-v2'
    },
    export: {
      filename: 'table-v2-demo'
    },
    selection: true,
    sorting: true
  }
})

const dispose = table.onAction(({ action, row }) => {
  ElMessage.success(`触发动作: ${action} / ID: ${row.id}`)
})

onBeforeUnmount(() => {
  dispose()
})

const selectedCount = computed(() => table.state.selection?.rows.value.length ?? 0)

function handleRefresh() {
  users.value = generateUsers(128)
  ElMessage.success('V2 数据已刷新')
}
</script>

<template>
  <div class="demo-container">
    <div class="header">
      <h2>Table V2 组件能力</h2>
      <p class="subtitle">面向业务的表格能力组合，默认开箱可用</p>
      <div class="demo-tags">
        <el-tag v-for="tag in featureTags" :key="tag" effect="plain" round>
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <el-card shadow="never" class="table-card demo-card">
      <StarTableRoot :table="table">
        <StarTableView>
          <template #leftTop>
            <div class="demo-summary">
              <el-tag type="success" effect="plain" round>共 {{ users.length }} 条</el-tag>
              <el-tag type="info" effect="plain" round>已选 {{ selectedCount }} 条</el-tag>
            </div>
          </template>
          <template #rightTop>
            <div class="demo-right-top">
              <el-button type="primary" size="small">新建成员</el-button>
              <StarTableToolbar @refresh="handleRefresh" />
            </div>
          </template>
          <template #footer>
            <div class="demo-footer">
              <span class="demo-footer-text">已选 {{ selectedCount }} 条</span>
              <StarTablePagination />
            </div>
          </template>
        </StarTableView>
      </StarTableRoot>
    </el-card>
  </div>
</template>
