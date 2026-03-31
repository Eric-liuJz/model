import { describe, it, expect, vi } from 'vitest'
import { useExport } from '../src/hooks/useExport'
import type { ColumnConfig } from '../src/types/column'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

// Mock XLSX 以阻止真实的文件写入和 DOM 操作
vi.mock('xlsx', () => {
  return {
    writeFile: vi.fn(),
    utils: {
      aoa_to_sheet: vi.fn(() => ({})),
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn()
    }
  }
})

describe('useExport', () => {

  const { resolveExportColumns, exportToExcel } = useExport()

  const mockColumns: ColumnConfig<any>[] = [
    { prop: 'selection', type: 'selection' },
    { prop: 'index', type: 'index', label: '序号' },
    { prop: 'name', label: '姓名', type: 'text' },
    { 
      prop: 'role', 
      label: '角色', 
      type: 'tag', 
      typeOptions: { '1': { text: '管理员' }, '2': { text: '普通用户' } }
    },
    { 
      prop: 'joinDate', 
      label: '加入时间', 
      type: 'date',
      typeOptions: { format: 'YYYY/MM/DD' }
    },
    { prop: 'action', type: 'action', label: '操作' }
  ]

  it('resolveExportColumns 应当自动排除功能列并保留数据列', () => {
    const maps = resolveExportColumns(mockColumns)
    
    // selection, index, action 应该被过滤掉
    expect(maps).toHaveLength(3)
    const props = maps.map(m => m.prop)
    
    expect(props).toContain('name')
    expect(props).toContain('role')
    expect(props).toContain('joinDate')
    
    expect(props).not.toContain('selection')
    expect(props).not.toContain('index')
    expect(props).not.toContain('action')
  })

  it('构建的 formatter 应当能正确翻译 tag 字典', () => {
    const maps = resolveExportColumns(mockColumns)
    const roleMap = maps.find(m => m.prop === 'role')
    
    expect(roleMap?.formatter).toBeDefined()
    
    // 测试字典映射值
    expect(roleMap!.formatter!('1', {})).toBe('管理员')
    expect(roleMap!.formatter!('2', {})).toBe('普通用户')
    
    // 测试未知值回退
    expect(roleMap!.formatter!('999', {})).toBe('999')
  })

  it('构建的 formatter 应当能正确格式化 date 日期', () => {
    const maps = resolveExportColumns(mockColumns)
    const dateMap = maps.find(m => m.prop === 'joinDate')
    
    expect(dateMap?.formatter).toBeDefined()
    
    const timestamp = 1711868400000 // 某个绝对时间戳
    const expected = dayjs(timestamp).format('YYYY/MM/DD')
    
    expect(dateMap!.formatter!(timestamp, {})).toBe(expected)
    // 判空处理
    expect(dateMap!.formatter!(null, {})).toBe('')
  })

  it('exportToExcel 应当正确调用 XLSX 的 API 完成导出编排', () => {
    const mockData = [
      { name: 'Alice', role: '1', joinDate: 1711868400000 },
      { name: 'Bob', role: '2', joinDate: null }
    ]

    exportToExcel({
      columns: mockColumns,
      data: mockData,
      filename: '测试导出'
    })

    // 验证 aoa_to_sheet 被调用（即数据组装）
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled()
    
    // 验证 append sheet
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled()

    // 验证 writeFile 被调用并带上了正确的文件名
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.any(Object), '测试导出.xlsx')
  })
})
