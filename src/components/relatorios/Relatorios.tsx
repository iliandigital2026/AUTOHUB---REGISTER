import { useMemo, useState } from 'react'
import { useUserRole } from '../../hooks/useUserRole'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Trophy, TrendingUp, Package, Clock } from 'lucide-react'
import type { Pedido } from '../../types'

interface Props { pedidos: Pedido[] }

const CORES = ['#F58226', '#F97B3B', '#FAC775', '#FBDBA0', '#FDE8C4']

const css = `
  .rel-page { padding: 24px; }
  .rel-filter { background: #fff; border: 0.5px solid var(--border-card); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .rel-filter label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; }
  .rel-filter input[type=date] { font-family: 'Montserrat',sans-serif; font-size: 12px; padding: 7px 10px; border: 0.5px solid var(--border-card); border-radius: 8px; background: var(--bg-input); outline: none; }
  .rel-filter input[type=date]:focus { border-color: #F58226; }
  .btn-filtrar { background: #F58226; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Montserrat',sans-serif; }
  .rank-header { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 14px; }
  .rank-icon { color: #F58226; }
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  .card { background: #fff; border: 0.5px solid var(--border-card); border-radius: 12px; padding: 20px; }
  .card-title { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 16px; }
  .vend-rank { display: flex; flex-direction: column; gap: 10px; }
  .vend-rank-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; background: var(--bg-table-head); border: 0.5px solid var(--border-color); }
  .vend-rank-item:first-child { background: var(--bg-card)0E9; border-color: #F5822630; }
  .rank-pos { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .rank-1 { background: #F58226; color: #fff; }
  .rank-2 { background: var(--border-color); color: var(--text-secondary); }
  .rank-3 { background: #FAE8D0; color: #F58226; }
  .rank-n { background: var(--border-color); color: var(--text-muted); font-size: 11px; }
  .rank-nome { flex: 1; font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .rank-stats { text-align: right; }
  .rank-val { font-size: 13px; font-weight: 700; color: #F58226; }
  .rank-sub { font-size: 11px; color: var(--text-muted); }
  .kpis-vend { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 20px; }
  .kv-card { background: #fff; border: 0.5px solid var(--border-card); border-radius: 12px; padding: 14px 16px; position: relative; overflow: hidden; }
  .kv-accent { position: absolute; top:0; left:0; width:4px; height:100%; background:#F58226; }
  .kv-icon { color: #F58226; margin-bottom: 8px; }
  .kv-val { font-size: 20px; font-weight: 700; color: var(--text-primary); }
  .kv-lbl { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-top: 3px; }
  .no-data { text-align: center; padding: 40px; color: var(--text-muted); font-size: 13px; }
`

function fmtMoeda(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function calcTempo(pedidos: Pedido[]) {
  const validos = pedidos.filter(p => {
    if (!p.started_at || !p.ended_at) return false
    const diff = new Date(p.ended_at).getTime() - new Date(p.started_at).getTime()
    return diff > 0 && diff < 24 * 60 * 60 * 1000
  })
  if (!validos.length) return '—'
  const avg = validos.reduce((acc, p) =>
    acc + (new Date(p.ended_at).getTime() - new Date(p.started_at).getTime()), 0) / validos.length / 1000
  const m = Math.floor(avg / 60), s = Math.round(avg % 60)
  return `${m}m ${s}s`
}

export default function Relatorios({ pedidos }: Props) {
  const { role, vendedorNome } = useUserRole()
  const hoje = new Date()
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fim = hoje.toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(ini)
  const [dateTo, setDateTo] = useState(fim)
  const [range, setRange] = useState({ from: ini, to: fim })

  const filtrados = useMemo(() => {
    const d1 = new Date(range.from), d2 = new Date(range.to)
    d2.setHours(23, 59, 59)
    return pedidos.filter(p => { const d = new Date(p.created_at); return d >= d1 && d <= d2 })
  }, [pedidos, range])

  const finalizados = filtrados.filter(p => {
    if (!((p.status === 'finalizado' || p.status === 'concluido') && p.vendedor)) return false
    if (role === 'vendedor' && vendedorNome) return p.vendedor === vendedorNome
    return true
  })

  const vendMap = useMemo(() => {
    const m = new Map<string, { pedidos: number; total: number; pedidosData: Pedido[] }>()
    finalizados.forEach(p => {
      const nome = p.vendedor!
      const ex = m.get(nome) || { pedidos: 0, total: 0, pedidosData: [] }
      m.set(nome, { pedidos: ex.pedidos + 1, total: ex.total + p.total, pedidosData: [...ex.pedidosData, p] })
    })
    return m
  }, [finalizados])

  const ranking = Array.from(vendMap.entries())
    .map(([nome, d]) => ({ nome, ...d }))
    .sort((a, b) => b.total - a.total)

  const totalGeral = ranking.reduce((a, v) => a + v.total, 0)
  const melhor = ranking[0]

  const chartData = ranking.map((v, i) => ({ nome: v.nome.split(' ')[0], total: v.total, cor: CORES[i] || '#ddd' }))

  return (
    <>
      <style>{css}</style>
      <div className="rel-page">
        <div className="rel-filter">
          <label>Período</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span style={{ fontSize: 12, color: '#999' }}>até</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <button className="btn-filtrar" onClick={() => setRange({ from: dateFrom, to: dateTo })}>Filtrar</button>
          <span style={{ fontSize: 12, color: '#999', marginLeft: 'auto', fontWeight: 600 }}>
            {finalizados.length} pedidos com vendedor atribuído
          </span>
        </div>

        <div className="kpis-vend">
          <div className="kv-card">
            <div className="kv-accent" />
            <div className="kv-icon"><Trophy size={18} /></div>
            <div className="kv-val">{melhor?.nome.split(' ')[0] || '—'}</div>
            <div className="kv-lbl">Melhor vendedor</div>
          </div>
          <div className="kv-card">
            <div className="kv-accent" />
            <div className="kv-icon"><TrendingUp size={18} /></div>
            <div className="kv-val">{fmtMoeda(totalGeral)}</div>
            <div className="kv-lbl">Faturamento total</div>
          </div>
          <div className="kv-card">
            <div className="kv-accent" />
            <div className="kv-icon"><Package size={18} /></div>
            <div className="kv-val">{finalizados.length}</div>
            <div className="kv-lbl">Pedidos registrados</div>
          </div>
          <div className="kv-card">
            <div className="kv-accent" />
            <div className="kv-icon"><Clock size={18} /></div>
            <div className="kv-val">{calcTempo(filtrados)}</div>
            <div className="kv-lbl">Tempo médio IA</div>
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="no-data">Nenhum pedido com vendedor atribuído no período selecionado.</div>
        ) : (
          <div className="row2">
            <div className="card">
              <div className="card-title"><Trophy size={14} style={{ color: '#F58226', display: 'inline', marginRight: 6 }} />Ranking de vendedores</div>
              <div className="vend-rank">
                {ranking.map((v, i) => (
                  <div key={v.nome} className="vend-rank-item">
                    <div className={`rank-pos rank-${i < 3 ? i + 1 : 'n'}`}>{i + 1}º</div>
                    <div className="rank-nome">{v.nome}</div>
                    <div className="rank-stats">
                      <div className="rank-val">{fmtMoeda(v.total)}</div>
                      <div className="rank-sub">{v.pedidos} pedido{v.pedidos !== 1 ? 's' : ''} · {calcTempo(v.pedidosData)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Faturamento por vendedor</div>
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#999' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 12, fill: '#555', fontWeight: 600 }} width={70} />
                    <Tooltip formatter={(v: number) => fmtMoeda(v)} cursor={{ fill: '#FFF0E9' }} />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                      {chartData.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {ranking.length > 0 && (
          <div className="card">
            <div className="card-title">Detalhamento por vendedor</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Vendedor','Pedidos','Faturamento','Ticket Médio','Tempo Médio','% do Total'].map(h => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.4px', padding: '8px 12px', textAlign: 'left', borderBottom: '0.5px solid var(--border-color)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((v, i) => (
                  <tr key={v.nome} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span style={{ marginRight: 8, fontSize: 14 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}º`}</span>
                      {v.nome}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#555' }}>{v.pedidos}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#F58226' }}>{fmtMoeda(v.total)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#555' }}>{fmtMoeda(v.total / v.pedidos)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#555' }}>{calcTempo(v.pedidosData)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#555' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: 'var(--border-color)', borderRadius: 20, height: 7, overflow: 'hidden', minWidth: 60 }}>
                          <div style={{ width: `${totalGeral ? Math.round((v.total/totalGeral)*100) : 0}%`, height: '100%', background: CORES[i] || '#ddd', borderRadius: 20 }} />
                        </div>
                        {totalGeral ? Math.round((v.total/totalGeral)*100) : 0}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
