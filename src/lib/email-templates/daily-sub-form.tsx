import * as React from 'react'
import { Body, Container, Head, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface FormCell { lines: { text: string; tone?: 'sub' | 'missing' | 'lead' }[]; rowSpan?: number }
interface Props { dayLabel?: string; dateLabel?: string; headers?: [string, string][]; rows?: { label: string; cells: (FormCell | null)[] }[]; missing?: string[] }

const border = '1px solid #555'
const color = { sub: '#1d4ed8', missing: '#dc2626', lead: '#111' }

function DailySubForm({ dayLabel = '', dateLabel = '', headers = [], rows = [], missing = [] }: Props) {
  return (
    <Html lang="he" dir="rtl">
      <Head />
      <Preview>{`טופס מ"מ מורות — ${dateLabel}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
        <Container style={{ maxWidth: '100%', padding: '12px' }}>
          <Text style={{ textAlign: 'center', fontSize: '18px', fontWeight: 700, textDecoration: 'underline', margin: 0 }}>צוות הוראה</Text>
          <Text style={{ textAlign: 'center', fontWeight: 600 }}>יום: {dayLabel} &nbsp; תאריך: {dateLabel}</Text>
          <table dir="rtl" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', textAlign: 'center' }}>
            <thead><tr>
              <th style={{ border, padding: '4px' }}>תשפ"ז</th>
              {headers.map(([c, t]) => <th key={c} style={{ border, padding: '4px' }}>{c}<br />{t}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r) => <tr key={r.label}>
                <th style={{ border, padding: '4px', whiteSpace: 'nowrap' }}>{r.label}</th>
                {r.cells.map((cell, i) => cell === null ? null : <td key={i} rowSpan={cell.rowSpan} style={{ border, padding: '4px', height: '36px' }}>
                  {cell.lines.map((l, j) => <div key={j} style={{ color: color[l.tone ?? 'sub'], fontWeight: l.tone === 'missing' ? 400 : 700, fontSize: l.tone === 'lead' ? '16px' : '12px' }}>{l.text}</div>)}
                </td>)}
              </tr>)}
              <tr><td colSpan={headers.length + 1} style={{ border, padding: '8px', textAlign: 'right', fontSize: '16px' }}>
                <b>צוות הוראה חסר: </b>{missing.join('   ')}
              </td></tr>
            </tbody>
          </table>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DailySubForm,
  subject: (d: Record<string, any>) => `טופס מ"מ מורות — יום ${d['dayLabel'] ?? ''} ${d['dateLabel'] ?? ''}`,
  displayName: 'טופס מילוי מקום יומי',
  to: 'idud123@gmail.com',
  previewData: { dayLabel: 'ראשון', dateLabel: '18/10/2026', headers: [["א'1", 'יעל']], rows: [{ label: 'שיעור 1', cells: [{ lines: [{ text: 'אולגה-מ"מ' }] }] }], missing: ['יוסף מעיין'] },
} satisfies TemplateEntry
