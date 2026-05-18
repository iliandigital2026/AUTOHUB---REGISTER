import * as XLSX from 'xlsx'
import type { Pedido } from '../types'

export function exportarExcel(pedidos: Pedido[], dateFrom: string, dateTo: string) {
  const wb = XLSX.utils.book_new()

  const fatRows = pedidos
    .filter(p => p.status === 'finalizado')
    .map(p => ({
      'Data': new Date(p.created_at).toLocaleDateString('pt-BR'),
      'Cliente': p.cliente_nome,
      'Telefone': p.cliente_telefone,
      'Veículo': `${p.veiculo_carro} ${p.veiculo_ano}`,
      'Placa': p.veiculo_placa,
      'Itens': (p.itens || []).map((i: { descricao: string; valor: number }) => i.descricao).join(' | '),
      'Total (R$)': p.total,
      'Forma Pagamento': p.forma_pagamento?.toUpperCase(),
      'Vendedor': p.vendedor || '—',
      'Tempo Atendimento': calcTempo(p.started_at, p.ended_at),
    }))

  const ws1 = XLSX.utils.json_to_sheet(fatRows)
  ws1['!cols'] = [
    { wch: 12 }, { wch: 25 }, { wch: 16 }, { wch: 20 },
    { wch: 12 }, { wch: 40 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
  ]
  XLSX.utils.book_append_sheet(wb, ws1, 'Faturamento')

  const clienteMap = new Map<string, { pedidos: number; total: number; ultima: string }>()
  pedidos.forEach(p => {
    const existing = clienteMap.get(p.cliente_nome) || { pedidos: 0, total: 0, ultima: '' }
    clienteMap.set(p.cliente_nome, {
      pedidos: existing.pedidos + 1,
      total: existing.total + p.total,
      ultima: p.created_at > existing.ultima ? p.created_at : existing.ultima,
    })
  })

  const clienteRows = Array.from(clienteMap.entries()).map(([nome, d]) => ({
    'Cliente': nome,
    'Total de Pedidos': d.pedidos,
    'Valor Acumulado (R$)': d.total,
    'Última Compra': d.ultima ? new Date(d.ultima).toLocaleDateString('pt-BR') : '—',
  }))

  const ws2 = XLSX.utils.json_to_sheet(clienteRows)
  ws2['!cols'] = [{ wch: 25 }, { wch: 16 }, { wch: 20 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Clientes')

  const filename = `autogestao_${dateFrom}_${dateTo}.xlsx`
  XLSX.writeFile(wb, filename)
}

function calcTempo(start: string, end: string): string {
  if (!start || !end) return '—'
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  const m = Math.floor(diff / 60)
  const s = diff % 60
  return `${m}m ${s}s`
}
