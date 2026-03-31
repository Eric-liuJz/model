import { ref, h } from 'vue'
import { ElTag, ElIcon } from 'element-plus'
import { StarFilled } from '@element-plus/icons-vue'
import type { ColumnConfig } from '@star-table/core'

/** 用户行数据结构 */
export interface UserRow {
  id: string
  name: string
  role: number
  status: string
  joinDate: number
  homepage: string
  score: number
  details: string
}

export const mockTableData = ref<UserRow[]>([
  { id: '1001', name: 'Alice', role: 1, status: 'active', joinDate: Date.now() - 1000000000, homepage: 'https://example.com/alice', score: 95, details: '这是 Alice 的详细介绍数据，平时隐藏在折叠面板中。' },
  { id: '1002', name: 'Bob', role: 2, status: 'inactive', joinDate: Date.now() - 5000000000, homepage: 'https://example.com/bob', score: 82, details: 'Bob 是一个普通用户，没有什么特别的介绍。' },
  { id: '1003', name: 'Charlie_this_is_a_very_long_name_to_trigger_overflow_tooltip', role: 1, status: 'banned', joinDate: Date.now() - 9000000000, homepage: 'https://example.com/charlie_this_is_very_very_long', score: 45, details: '由于违规操作，该账号已经被永久封禁。' },
])

/** 基础演示表格的列配置定义 */
export const basicColumnsConfig: ColumnConfig<UserRow>[] = [
  { prop: 'expand', type: 'expand', fixed: 'left' },
  { prop: 'selection', type: 'selection', fixed: 'left' },
  { prop: 'index', type: 'index', label: '序号', width: 60, align: 'center' },
  { prop: 'id', label: 'ID', width: 80, align: 'center', sortable: true },
  { 
    prop: 'name', 
    label: '用户名', 
    minWidth: 120, 
    headerTooltip: { content: '用户的登录账号名，要求全网唯一', placement: 'right' },
    showOverflowTooltip: true
  },
  { 
    prop: 'role', 
    label: '角色', 
    type: 'tag', 
    width: 100,
    align: 'center',
    typeOptions: {
      '1': { text: '管理员', type: 'danger' },
      '2': { text: '普通用户', type: 'info' }
    }
  },
  { 
    prop: 'status', 
    label: '状态', 
    type: 'tag', 
    width: 120,
    align: 'center',
    filters: [
      { text: '正常', value: 'active' },
      { text: '未激活', value: 'inactive' },
      { text: '封禁', value: 'banned' },
    ],
    filterMultiple: true,
    typeOptions: {
      'active': { text: '正常', type: 'success' },
      'inactive': { text: '未激活', type: 'warning' },
      'banned': { text: '封禁', type: 'danger' },
    }
  },
  { 
    prop: 'joinDate', 
    label: '加入时间', 
    type: 'date', 
    width: 180,
    sortable: true,
    typeOptions: { format: 'YYYY-MM-DD HH:mm' }
  },
  { 
    prop: 'homepage', 
    label: '个人主页', 
    type: 'link', 
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    prop: 'score',
    label: '信用分',
    width: 120,
    align: 'center',
    // 自定义表头渲染 (renderHeader)
    renderHeader: () => h('div', { style: 'display: flex; align-items: center; justify-content: center; gap: 4px; color: #e6a23c;' }, [
      h(ElIcon, null, { default: () => h(StarFilled) }),
      h('span', '信用分')
    ]),
    // 自定义单元格渲染 (renderCell)
    renderCell: (row: UserRow) => {
      const type = row.score >= 90 ? 'success' : row.score >= 60 ? 'warning' : 'danger'
      return h(ElTag, { type, effect: 'dark', round: true }, () => `${row.score} 分`)
    }
  },
  {
    prop: 'action',
    type: 'action',
    label: '操作 (配置驱动)',
    fixed: 'right',
    width: 180,
    typeOptions: {
      actions: [
        { label: '编辑', event: 'edit', type: 'primary' },
        { label: '删除', event: 'delete', type: 'danger', confirm: '确定要删除此用户吗？' }
      ]
    }
  },
  {
    prop: 'customAction',
    type: 'action',
    label: '操作 (插槽)',
    width: 150,
  }
]
