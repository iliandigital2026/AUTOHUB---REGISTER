import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Download, Filter, TrendingUp, MessageCircle, Clock, DollarSign } from 'lucide-react'
import type { Pedido } from '../../types'
import { exportarExcel } from '../../services/excel'

interface Props { pedidos: Pedido[] }

const CORES_PGTO: Record<string, string> = {
  pix: '#F58226', credito: '#F97B3B', debito: '#FAC775', dinheiro: '#BBBBBB'
}
const LABELS_PGTO: Record<string, string> = {
  pix: 'PIX', credito: 'Credito', debito: 'Debito', dinheiro: 'Dinheiro'
}

const css = `
  .dash-page { padding: 24px; max-width: 1400px; }
  .filter-bar { background: #fff; border: 0.5px solid #E0E0E0; border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
  .filter-bar label { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .5px; }
  .filter-bar input[type=date] { font-family: 'Montserrat', sans-serif; font-size: 12px; padding: 7px 10px; border: 0.5px solid #E0E0E0; border-radius: 8px; background: #F6F6F6; color: #1A1A1A; outline: none; }
  .filter-bar input[type=date]:focus { border-color: #F58226; }
  .btn-primary { background: #F58226; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; font-family: 'Montserrat', sans-serif; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: opacity .15s; }
  .btn-primary:hover { opacity: .88; }
  .btn-outline { background: transparent; color: #F58226; border: 1px solid #F58226; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 700; font-family: 'Montserrat', sans-serif; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background .15s; }
  .btn-outline:hover { background: #FFF0E9; }
  .periodo-label { font-size: 12px; color: #999; margin-left: auto; font-weight: 600; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .kpi-card { background: #fff; border: 0.5px solid #E0E0E0; border-radius: 12px; padding: 18px 20px; position: relative; overflow: hidden; }
  .kpi-accent { position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #F58226; }
  .kpi-label { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .kpi-value { font-size: 24px; font-weight: 700; color: #1A1A1A; }
  .kpi-sub { font-size: 11px; color: #999; margin-top: 4px; }
  .charts-row { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 20px; }
  .tables-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .card { background: #fff; border: 0.5px solid #E0E0E0; border-radius: 12px; padding: 20px; }
  .card-title { font-size: 12px; font-weight: 700; color: #1A1A1A; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .card-title-icon { color: #F58226; }
  .peca-table { width: 100%; border-collapse: collapse; }
  .peca-table th { font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .5px; padding: 0 8px 10px 0; text-align: left; border-bottom: 0.5px solid #F0F0F0; }
  .peca-table td { font-size: 12px; color: #555; padding: 8px 8px 8px 0; border-bottom: 0.5px solid #F8F8F8; vertical-align: middle; }
  .peca-table tr:last-child td { border-bottom: none; }
  .peca-bar-wrap { display: flex; align-items: center; gap: 8px; }
  .peca-bar-track { flex: 1; background: #F0F0F0; border-radius: 20px; height: 8px; overflow: hidden; min-width: 60px; }
  .peca-bar-fill { height: 100%; background: #F58226; border-radius: 20px; }
  .peca-qtd { font-size: 11px; font-weight: 700; color: #1A1A1A; white-space: nowrap; }
  .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .bar-label { font-size: 11px; color: #666; font-weight: 500; min-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar-track { flex: 1; background: #F0F0F0; border-radius: 20px; height: 10px; overflow: hidden; }
  .bar-fill { height: 100%; background: #F58226; border-radius: 20px; }
  .bar-val { font-size: 11px; font-weight: 700; color: #1A1A1A; min-width: 42px; text-align: right; }
  .client-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 0.5px solid #F0F0F0; }
  .client-row:last-child { border-bottom: none; }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: #FFF0E9; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #F58226; flex-shrink: 0; }
  .client-info { flex: 1; min-width: 0; }
  .client-name { font-size: 12px; font-weight: 600; color: #1A1A1A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .client-detail { font-size: 11px; color: #999; }
  .client-val { font-size: 13px; font-weight: 700; color: #F58226; }
  .pay-row { margin-bottom: 12px; }
  .pay-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
  .pay-label { font-size: 12px; font-weight: 500; color: #1A1A1A; display: flex; align-items: center; gap: 7px; }
  .pay-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .pay-val { font-size: 12px; font-weight: 700; color: #1A1A1A; }
  .pay-pct { font-size: 10px; color: #999; margin-left: 4px; }
  .pay-bar-track { width: 100%; background: #F0F0F0; border-radius: 20px; height: 7px; overflow: hidden; }
  .pay-bar-fill { height: 100%; border-radius: 20px; }
  .ia-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .ia-card { background: #F6F6F6; border-radius: 10px; padding: 12px; text-align: center; }
  .ia-num { font-size: 18px; font-weight: 700; color: #F58226; }
  .ia-lbl { font-size: 10px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: .4px; margin-top: 3px; }
  .entrega-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .entrega-card { background: #F9F9F9; border-radius: 10px; padding: 14px 16px; border: 0.5px solid #E0E0E0; }
  .entrega-num { font-size: 24px; font-weight: 700; }
  .entrega-lbl { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .4px; margin-top: 2px; }
  .entrega-bar { margin-top: 8px; height: 4px; background: #E0E0E0; border-radius: 4px; overflow: hidden; }
  .entrega-bar-fill { height: 100%; border-radius: 4px; }
  .entrega-pct { font-size: 10px; color: #bbb; margin-top: 4px; }
  @media(max-width:900px){ .kpis{grid-template-columns:1fr 1fr} .charts-row,.tables-row{grid-template-columns:1fr} .entrega-grid{grid-template-columns:1fr} }
  .peca-scroll::-webkit-scrollbar { width: 10px; }
  .peca-scroll::-webkit-scrollbar-track { background: #F5F5F5; border-radius: 10px; }
  .peca-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #F58226, #D62C27); border-radius: 10px; border: 2px solid #F5F5F5; }
  .peca-scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #E8421F, #C62828); }
  .peca-scroll::-webkit-scrollbar-button:single-button { display: block; height: 16px; border-radius: 4px; }
  .peca-scroll::-webkit-scrollbar-button:single-button:vertical:decrement { background: #F58226 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M5 3l4 4H1z' fill='white'/%3E%3C/svg%3E") no-repeat center; border-radius: 4px 4px 0 0; }
  .peca-scroll::-webkit-scrollbar-button:single-button:vertical:increment { background: #D62C27 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M5 7L1 3h8z' fill='white'/%3E%3C/svg%3E") no-repeat center; border-radius: 0 0 4px 4px; }
`

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function calcTempo(pedidos: Pedido[]) {
  const validos = pedidos.filter(p => {
    if (!p.started_at || !p.ended_at) return false
    const diff = new Date(p.ended_at).getTime() - new Date(p.started_at).getTime()
    return diff > 0 && diff < 24 * 60 * 60 * 1000
  })
  if (!validos.length) return '-'
  const avg = validos.reduce((acc, p) => {
    return acc + (new Date(p.ended_at).getTime() - new Date(p.started_at).getTime())
  }, 0) / validos.length / 1000
  const m = Math.floor(avg / 60)
  const s = Math.round(avg % 60)
  return `${m}m ${s}s`
}

function parseItem(it: unknown): { marca: string; descricao: string } {
  if (typeof it === 'string') {
    // tenta separar "Produto - Marca" ou "Marca Produto"
    return { marca: '-', descricao: it }
  }
  const obj = it as Record<string, string>
  return {
    marca: obj.marca || '-',
    descricao: obj.descricao || obj.nome || String(it),
  }
}

export default function Dashboard({ pedidos }: Props) {
  const hoje = new Date()
  // corrigir fuso horario: usar data local nao UTC
  const offset = hoje.getTimezoneOffset() * 60000
  const hojeLocal = new Date(hoje.getTime() - offset)
  const primeiroDia = new Date(hojeLocal.getFullYear(), hojeLocal.getMonth(), 1)
    .toISOString().split('T')[0]
  const ultimoDia = hojeLocal.toISOString().split('T')[0]

  const [dateFrom, setDateFrom] = useState(primeiroDia)
  const [dateTo, setDateTo] = useState(ultimoDia)
  const [filteredRange, setFilteredRange] = useState({ from: primeiroDia, to: ultimoDia })

  const filtrados = useMemo(() => {
    const d1 = new Date(filteredRange.from)
    const d2 = new Date(filteredRange.to)
    // incluir dia inteiro no fuso local
    d2.setHours(23, 59, 59, 999)
    return pedidos.filter(p => {
      const d = new Date(p.created_at)
      return d >= d1 && d <= d2
    })
  }, [pedidos, filteredRange])

  const finalizados = filtrados.filter(p => p.status === 'finalizado' || p.status === 'concluido')
  const faturamento = finalizados.reduce((a, p) => a + p.total, 0)
  const conversao = filtrados.length ? Math.round((finalizados.length / filtrados.length) * 100) : 0
  const tempoMedio = calcTempo(filtrados)

  // Pecas mais vendidas — chave: "marca||descricao"
  const pecasMap = new Map<string, { marca: string; descricao: string; carro: string; ano: string; qtd: number }>()
  finalizados.forEach(p => {
    let itensArr: unknown[] = []
    if (Array.isArray(p.itens)) {
      itensArr = p.itens
    } else if (typeof p.itens === 'string') {
      try { itensArr = JSON.parse(p.itens) } catch { itensArr = [p.itens] }
    }
    const marcaPedido = (p as { marca_produto?: string }).marca_produto || '-'
    const carroPedido = (p as { veiculo_carro?: string }).veiculo_carro || '-'
    const anoPedido = (p as { veiculo_ano?: string }).veiculo_ano || ''
    const qtdPedido = parseInt(String((p as { quantidade?: string }).quantidade || '1')) || 1
    itensArr.forEach((it: unknown) => {
      const { descricao } = parseItem(it)
      if (!descricao) return
      const key = `${marcaPedido.toLowerCase()}||${descricao.toLowerCase().trim()}||${carroPedido.toLowerCase()}||${anoPedido}`
      const ex = pecasMap.get(key) || { marca: marcaPedido, descricao, carro: carroPedido, ano: anoPedido, qtd: 0 }
      pecasMap.set(key, { ...ex, qtd: ex.qtd + qtdPedido })
    })
  })
  const pecasTop = Array.from(pecasMap.values())
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 50)
  const maxPeca = pecasTop[0]?.qtd || 1

  // Formas de pagamento
  const pgtoMap = new Map<string, number>()
  finalizados.forEach(p => {
    const fp = (p.forma_pagamento || 'outros').toLowerCase()
    pgtoMap.set(fp, (pgtoMap.get(fp) || 0) + p.total)
  })
  const pgtoData = Array.from(pgtoMap.entries()).map(([tipo, valor]) => ({
    tipo, valor, label: LABELS_PGTO[tipo] || tipo.toUpperCase(), cor: CORES_PGTO[tipo] || '#ccc',
    pct: faturamento ? Math.round((valor / faturamento) * 100) : 0,
  })).sort((a, b) => b.valor - a.valor)

  // Formas de entrega
  const entregaMap = new Map<string, number>()
  filtrados.forEach(p => {
    const fe = (p.forma_entrega || 'balcao').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace('retirada', 'balcao')
    entregaMap.set(fe, (entregaMap.get(fe) || 0) + 1)
  })
  const entregaData = [
    { tipo: 'balcao', label: 'Balcao', qtd: entregaMap.get('balcao') || 0, cor: '#7C3AED' },
    { tipo: 'entrega', label: 'Entrega', qtd: entregaMap.get('entrega') || 0, cor: '#1565C0' },
    { tipo: 'transportadora', label: 'Transportadora', qtd: entregaMap.get('transportadora') || 0, cor: '#E65100' },
  ]

  // Top 5 clientes
  const clienteMap = new Map<string, { pedidos: number; total: number }>()
  filtrados.forEach(p => {
    const ex = clienteMap.get(p.cliente_nome) || { pedidos: 0, total: 0 }
    clienteMap.set(p.cliente_nome, { pedidos: ex.pedidos + 1, total: ex.total + p.total })
  })
  const top5 = Array.from(clienteMap.entries())
    .sort((a, b) => b[1].total - a[1].total).slice(0, 5)

  // Atendimentos por dia
  const diasMap = new Map<string, number>()
  filtrados.forEach(p => {
    const dia = p.created_at.split('T')[0]
    diasMap.set(dia, (diasMap.get(dia) || 0) + 1)
  })
  const lineData = Array.from(diasMap.entries()).sort().map(([dia, qtd]) => ({
    dia: dia.slice(5), qtd
  }))

  const pieData = pgtoData.map(d => ({ name: d.label, value: d.valor, cor: d.cor }))

  return (
    <>
      <style>{css}</style>
      <div className="dash-page">
        <div className="filter-bar">
          <label>Periodo</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span style={{ fontSize: 12, color: '#999' }}>ate</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <button className="btn-primary" onClick={() => setFilteredRange({ from: dateFrom, to: dateTo })}>
            <Filter size={13} /> Filtrar
          </button>
          <button className="btn-outline" onClick={() => exportarExcel(filtrados, dateFrom, dateTo)}>
            <Download size={13} /> Exportar Excel
          </button>
          <span className="periodo-label">{filtrados.length} atendimentos no periodo</span>
        </div>

        <div className="kpis">
          <div className="kpi-card">
            <div className="kpi-accent" />
            <div className="kpi-label"><DollarSign size={13} className="card-title-icon" /> Faturamento IA</div>
            <div className="kpi-value">{fmtMoeda(faturamento)}</div>
            <div className="kpi-sub">{finalizados.length} pedidos finalizados</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-accent" />
            <div className="kpi-label"><MessageCircle size={13} className="card-title-icon" /> Atendimentos</div>
            <div className="kpi-value">{filtrados.length}</div>
            <div className="kpi-sub">total no periodo</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-accent" />
            <div className="kpi-label"><Clock size={13} className="card-title-icon" /> Tempo medio coleta</div>
            <div className="kpi-value">{tempoMedio}</div>
            <div className="kpi-sub">do inicio ao pedido</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-accent" />
            <div className="kpi-label"><TrendingUp size={13} className="card-title-icon" /> Taxa conversao</div>
            <div className="kpi-value">{conversao}%</div>
            <div className="kpi-sub">chats que viraram pedido</div>
          </div>
        </div>

        <div className="charts-row">
          {/* Pecas mais vendidas — tabela Marca | Produto | Und */}
          <div className="card">
            <div className="card-title"><span className="card-title-icon">▪</span> Pecas mais vendidas</div>
            {pecasTop.length === 0 ? (
              <p style={{ fontSize: 13, color: '#999' }}>Nenhum dado no periodo</p>
            ) : (
              <div style={{ maxHeight: 236, overflowY: 'scroll', borderRadius: 8 }} className="peca-scroll">
            <table className="peca-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: 70, position: 'sticky', top: 0, background: '#fff', zIndex: 1, boxShadow: '0 1px 0 #F0F0F0' }}>Marca</th>
                    <th style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1, boxShadow: '0 1px 0 #F0F0F0' }}>Produto</th>
                    <th style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1, boxShadow: '0 1px 0 #F0F0F0' }}>Carro</th>
                    <th style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1, boxShadow: '0 1px 0 #F0F0F0' }}>Ano</th>
                    <th style={{ width: 120, position: 'sticky', top: 0, background: '#fff', zIndex: 1, boxShadow: '0 1px 0 #F0F0F0' }}>Unidades</th>
                  </tr>
                </thead>
                <tbody>
                  {pecasTop.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#1A1A1A' }}>{p.marca}</td>
                      <td>{p.descricao}</td>
                      <td style={{ color: '#666', fontSize: 12 }}>{p.carro}</td>
                      <td style={{ color: '#666', fontSize: 12 }}>{p.ano}</td>
                      <td>
                        <div className="peca-bar-wrap">
                          <div className="peca-bar-track">
                            <div className="peca-bar-fill" style={{ width: `${Math.round((p.qtd / maxPeca) * 100)}%` }} />
                          </div>
                          <span className="peca-qtd">{p.qtd} un.</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Formas de pagamento */}
          <div className="card">
            <div className="card-title"><span className="card-title-icon">▪</span> Formas de pagamento</div>
            {pieData.length > 0 && (
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtMoeda(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div style={{ marginTop: 8 }}>
              {pgtoData.map(p => (
                <div key={p.tipo} className="pay-row">
                  <div className="pay-top">
                    <div className="pay-label">
                      <div className="pay-dot" style={{ background: p.cor }} />
                      {p.label}
                    </div>
                    <div>
                      <span className="pay-val">{fmtMoeda(p.valor)}</span>
                      <span className="pay-pct">({p.pct}%)</span>
                    </div>
                  </div>
                  <div className="pay-bar-track">
                    <div className="pay-bar-fill" style={{ width: `${p.pct}%`, background: p.cor }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Formas de entrega */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><span className="card-title-icon">▪</span> Formas de entrega</div>
          <div className="entrega-grid">
            {entregaData.map(d => (
              <div key={d.tipo} className="entrega-card">
                <div className="entrega-num" style={{ color: d.cor }}>{d.qtd}</div>
                <div className="entrega-lbl">{d.label}</div>
                <div className="entrega-bar">
                  <div className="entrega-bar-fill" style={{ width: filtrados.length ? `${Math.round((d.qtd / filtrados.length) * 100)}%` : '0%', background: d.cor }} />
                </div>
                <div className="entrega-pct">{filtrados.length ? Math.round((d.qtd / filtrados.length) * 100) : 0}% dos pedidos</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tables-row">
          <div className="card">
            <div className="card-title"><span className="card-title-icon">▪</span> Top 5 clientes</div>
            {top5.map(([nome, d], i) => (
              <div key={nome} className="client-row">
                <div className="avatar">{iniciais(nome)}</div>
                <div className="client-info">
                  <div className="client-name">#{i + 1} {nome}</div>
                  <div className="client-detail">{d.pedidos} pedido{d.pedidos !== 1 ? 's' : ''}</div>
                </div>
                <div className="client-val">{fmtMoeda(d.total)}</div>
              </div>
            ))}
            {top5.length === 0 && <p style={{ fontSize: 13, color: '#999' }}>Nenhum dado no periodo</p>}
          </div>

          <div className="card">
            <div className="card-title"><span className="card-title-icon">▪</span> Metricas da IA</div>
            <div className="ia-grid">
              <div className="ia-card">
                <div className="ia-num">{filtrados.length}</div>
                <div className="ia-lbl">Atendimentos</div>
              </div>
              <div className="ia-card">
                <div className="ia-num">{tempoMedio}</div>
                <div className="ia-lbl">Tempo medio</div>
              </div>
              <div className="ia-card">
                <div className="ia-num">{conversao}%</div>
                <div className="ia-lbl">Conversao</div>
              </div>
            </div>
            {lineData.length > 0 && (
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={lineData}>
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#999' }} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => [`${v} atend.`, '']} />
                  <Line type="monotone" dataKey="qtd" stroke="#F58226" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center', marginTop: 4 }}>Atendimentos por dia</div>
          </div>
        </div>
      </div>
    </>
  )
}
