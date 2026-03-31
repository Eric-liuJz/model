import type { Component } from 'vue'
import type { ColumnType } from '../types/column'
import { CellText, CellDate, CellTag, CellLink, CellAction } from './cells'

/**
 * 单元格渲染工厂注册表。
 * 建立 ColumnType 到具体 Vue 原子组件的映射关系。
 * 新增渲染器类型时只需在此注册，无需修改 StarTable 核心模板。
 */
export const CellRendererRegistry: Record<string, Component> = {
  text: CellText,
  date: CellDate,
  tag: CellTag,
  link: CellLink,
  action: CellAction
}

/**
 * 根据列类型标识解析对应的渲染器组件。
 * 未匹配时回退至默认文本渲染器。
 *
 * @param type - ColumnType 枚举值
 * @returns 对应的 Vue 组件
 */
export function resolveRenderer(type?: ColumnType | string): Component {
  return CellRendererRegistry[type ?? 'text'] ?? CellRendererRegistry.text
}
