import { ref } from 'vue'
import type { ColumnConfig } from '@star-table/core'

/** 用户行数据结构 */
export interface UserRow {
  id: string
  name: string
  role: number
  status: string
  joinDate: number
  homepage: string
}

/** 模拟服务器返回的初始表格数据 */
export const mockTableData = ref<UserRow[]>([
  { id: '1001', name: 'Alice', role: 1, status: 'active', joinDate: Date.now() - 1000000000, homepage: 'https://example.com/alice' },
  { id: '1002', name: 'Bob', role: 2, status: 'inactive', joinDate: Date.now() - 5000000000, homepage: 'https://example.com/bob' },
  { id: '1003', name: 'Charlie', role: 1, status: 'banned', joinDate: Date.now() - 9000000000, homepage: 'https://example.com/charlie' },
])

/** 基础演示表格的列配置定义 */
export const basicColumnsConfig: ColumnConfig<UserRow>[] = [
  { prop: 'selection', type: 'selection', fixed: 'left' },
  { prop: 'id', label: 'ID', width: 80, align: 'center' },
  { 
    prop: 'name', 
    label: '用户名', 
    minWidth: 120, 
    headerTooltip: '用户的登录账号名' 
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
    width: 100,
    align: 'center',
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
    typeOptions: { format: 'YYYY-MM-DD HH:mm' }
  },
  { 
    prop: 'homepage', 
    label: '个人主页', 
    type: 'link', 
    minWidth: 150 
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
