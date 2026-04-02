<script setup lang="ts">
import { computed, h, onBeforeUnmount, ref } from 'vue'
import {
  StarTablePagination,
  StarTableRoot,
  StarTableToolbar,
  StarTableView,
  actionColumn,
  createStarTable,
  dateColumn,
  defineColumns,
  linkColumn,
  tagColumn,
  textColumn
} from '@star-table/table-v2'
import { ElInput, ElMessage, ElTag } from 'element-plus'

interface RemoteUserRow {
  id: number
  name: string
  status: 'active' | 'reviewing' | 'blocked'
  role: string
  createdAt: number
  homepage: string
}

const statuses: RemoteUserRow['status'][] = ['active', 'reviewing', 'blocked']
const roles = ['研发工程师', '产品经理', '设计师', '测试工程师', '数据分析师']

const remoteDataset: RemoteUserRow[] = Array.from({ length: 180 }, (_, index) => ({
  id: index + 1,
  name: `远程成员 ${index + 1}`,
  status: statuses[index % statuses.length],
  role: roles[index % roles.length],
  createdAt: Date.now() - index * 86400000,
  homepage: `https://star-table.dev/remote/users/${index + 1}`
}))

function compareValues(left: unknown, right: unknown) {
  if (left == null && right == null) return 0
  if (left == null) return -1
  if (right == null) return 1
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right))
}

const keyword = ref('')
const status = ref<'all' | RemoteUserRow['status']>('all')
const simulateError = ref(false)

const columns = defineColumns<RemoteUserRow>([
  textColumn('name', {
    title: '成员名称',
    accessor: 'name',
    minWidth: 180,
    sortable: true
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
      return map[String(value) as RemoteUserRow['status']]
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
  actionColumn<RemoteUserRow>({
    key: 'actions',
    title: '操作',
    width: 180,
    fixed: 'right',
    actions: [
      { key: 'view', label: '查看', type: 'primary' },
      { key: 'archive', label: '归档', type: 'warning', confirm: '确认归档这条远程记录？' }
    ]
  })
])

const table = createStarTable<RemoteUserRow>({
  getData: async ({ page, pageSize, sort, query }) => {
    await new Promise((resolve) => setTimeout(resolve, 420))

    if (query.simulateError) {
      throw new Error('模拟远程接口异常，请稍后重试')
    }

    let rows = [...remoteDataset]
    const keywordValue = String(query.keyword ?? '').trim()
    const statusValue = String(query.status ?? 'all')

    if (keywordValue) {
      rows = rows.filter(
        (row) => row.name.includes(keywordValue) || row.role.includes(keywordValue)
      )
    }

    if (statusValue !== 'all') {
      rows = rows.filter((row) => row.status === statusValue)
    }

    if (sort.key && sort.order) {
      rows.sort((left, right) => {
        const leftValue = left[sort.key as keyof RemoteUserRow]
        const rightValue = right[sort.key as keyof RemoteUserRow]
        const result = compareValues(leftValue, rightValue)
        return sort.order === 'ascending' ? result : result * -1
      })
    }

    const start = (page - 1) * pageSize
    const paged = rows.slice(start, start + pageSize)

    return {
      rows: paged,
      total: rows.length
    }
  },
  query: computed(() => ({
    keyword: keyword.value,
    status: status.value,
    simulateError: simulateError.value
  })),
  rowKey: 'id',
  columns,
  remote: {
    immediate: true,
    keepPreviousData: true
  },
  features: {
    pagination: {
      pageSize: 10,
      pageSizes: [10, 20, 50]
    },
    columnSettings: {
      cacheKey: 'play-table-v2-remote'
    },
    export: {
      filename: 'table-v2-remote-demo',
      scope: 'current'
    },
    sorting: true
  }
})

const dispose = table.onAction(({ action, row }) => {
  ElMessage.success(`远程动作: ${action} / ID: ${row.id}`)
})

onBeforeUnmount(() => {
  dispose()
})

const remoteState = table.state.remote
const totalCount = computed(() => remoteState?.total.value ?? 0)
const statusText = computed(() => remoteState?.status.value ?? 'idle')
const loading = computed(() => remoteState?.loading.value ?? false)
const isReloading = computed(() => remoteState?.isReloading.value ?? false)
const remoteError = computed(() => remoteState?.error.value as Error | null)
const lastUpdated = computed(() => {
  const value = remoteState?.lastUpdatedAt.value
  if (!value) return '尚未请求'
  return new Date(value).toLocaleTimeString('zh-CN', { hour12: false })
})

async function handleRefresh() {
  await table.actions.reload()
  if (!remoteError.value) {
    ElMessage.success('远程数据已刷新')
  }
}
</script>

<template>
  <div class="demo-container">
    <div class="header">
      <h2>Table V2 远程数据演示</h2>
      <p class="subtitle">
        通过 <code>getData</code> 接入异步数据源，表格内部统一接管分页、排序、加载状态与生命周期钩子
      </p>
    </div>

    <el-card shadow="never" class="table-card demo-card">
      <StarTableRoot :table="table">
        <StarTableView>
          <template #leftTop>
            <el-space wrap>
              <ElInput
                v-model="keyword"
                placeholder="搜索成员名称/角色"
                clearable
                class="remote-keyword"
              />
              <el-select v-model="status" placeholder="筛选状态" class="remote-status">
                <el-option label="全部状态" value="all" />
                <el-option label="正常" value="active" />
                <el-option label="审核中" value="reviewing" />
                <el-option label="受限" value="blocked" />
              </el-select>
              <el-switch
                v-model="simulateError"
                inline-prompt
                active-text="错误"
                inactive-text="正常"
              />
              <el-tag
                :type="loading ? 'warning' : remoteError ? 'danger' : 'success'"
                effect="plain"
                round
              >
                {{ statusText }}
              </el-tag>
              <el-tag type="info" effect="plain" round>总数 {{ totalCount }}</el-tag>
              <el-tag type="info" effect="plain" round>上次更新时间 {{ lastUpdated }}</el-tag>
              <el-tag v-if="isReloading" type="warning" effect="plain" round>刷新中</el-tag>
            </el-space>
          </template>
          <template #rightTop>
            <StarTableToolbar @refresh="handleRefresh" />
          </template>
          <template #footer>
            <StarTablePagination />
          </template>
        </StarTableView>
      </StarTableRoot>
    </el-card>
  </div>
</template>
