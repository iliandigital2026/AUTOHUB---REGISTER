import { useState, useMemo } from 'react'
import { Search, X, Clock, Phone } from 'lucide-react'
import type { Pedido } from '../../types'

interface Props { pedidos: Pedido[] }

const css = `
  .clientes-page { padding: 24px; }
  .clientes-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .search-box { flex: 1; position: relative; max-width: 360px; }
  .search-box input { width: 100%; padding: 9px 14px 9px 36px; border: 0.5px solid #E0E0E0; border-radius: 10px; font-family: 'Montserrat',sans-serif; font-size: 13px; background: #fff; color: #1A1A1A; outline: none; }
  .search-box input:focus { border-color: #F58226; }
  .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #bbb; }
  .table-wrap { background: #fff; border: 0.5px solid #E0E0E0; border-radius: 12px; overflow: hidden; }
  .table-wrap table { width: 100%; border-collapse: collapse; }
  .table-wrap th { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .5px; padding: 12px 16px; background: #F9F9F9; border-bottom: 0.5px solid #E8E8E8; text-align: left; }
  .table-wrap td { font-size: 13px; color: #1A1A1A; padding: 12px 16px; border-bottom: 0.5px solid #F0F0F0; vertical-align: middle; }
  .table-wrap tr:last-child td { border-bottom: none; }
  .table-wrap tr:hover td { background: #FFFAF8; }
  .avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: #FFF0E9; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #F58226; flex-shrink: 0; }
  .btn-hist { background: #FFF0E9; color: #F58226; border: 0.5px solid #F5822640; border-radius: 8px; padding: 5px 12px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Montserrat',sans-serif; transition: background .15s; }
  .btn-hist:hover { background: #F58226; color: #fff; }
  .wa-link { display: inline-flex; align-items: center; gap: 5px; color: #2E7D32; font-size: 12px; font-weight: 600; text-decoration: none; }
  .wa-link:hover { text-decoration: underline; }
  .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100; }
  .drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 420px; background: #fff; z-index: 101; box-shadow: -4px 0 24px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
  .drawer-header { padding: 20px 24px; border-bottom: 0.5px solid #E8E8E8; display: flex; align-items: center; justify-content: space-between; }
  .drawer-title { font-size: 15px; font-weight: 700; color: #1A1A1A; }
  .drawer-sub { font-size: 12px; color: #999; margin-top: 2px; }
  .drawer-close { width: 32px; height: 32px; border-radius: 8px; border: 0.5px solid #E0E0E0; background: #F6F6F6; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #666; }
  .drawer-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
  .hist-card { border: 0.5px solid #E0E0E0; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
  .hist-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .hist-date { font-size: 11px; color: #999; display: flex; align-items: center; gap: 4px; }
  .hist-status { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
  .status-fin { background: #E8F5E9; color: #2E7D32; }
  .status-ag { background: #FFF8E1; color: #F57F17; }
  .status-em { background: #FFF0E9; color: #F58226; }
  .hist-item { font-size: 12px; color: #555; margin-bottom: 3px; display: flex; justify-content: space-between; }
  .hist-total { font-size: 13px; font-weight: 700; color: #F58226; margin-top: 8px; }
  .empty { text-align: center; padding: 48px; color: #bbb; font-size: 13px; }
`

function iniciais(n: string) { return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }
function fmtMoeda(v: number) { return (v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) }
function fmtData(d: string) { return new Date(d).toLocaleDateString('pt-BR') }

const STATUS_LABEL: Record<string, string> = {
  finalizado: 'Finalizado', aguardando_registro: 'Aguardando', em_atendimento: 'Em atendimento'
}

export default function Clientes({ pedidos }: Props) {
  const [busca, setBusca] = useState('')
  const [historico, setHistorico] = useState<string | null>(null)

  const clienteMap = useMemo(() => {
    const map = new Map<string, { telefone: string; pedidos: Pedido[]; total: number; ultima: string }>()
    pedidos.forEach(p => {
      const ex = map.get(p.cliente_nome) || { telefone: p.cliente_telefone, pedidos: [], total: 0, ultima: '' }
      map.set(p.cliente_nome, {
        telefone: p.cliente_telefone || ex.telefone,
        pedidos: [...ex.pedidos, p],
        total: ex.total + (p.total || 0),
        ultima: p.created_at > ex.ultima ? p.created_at : ex.ultima,
      })
    })
    return map
  }, [pedidos])

  const lista = useMemo(() => {
    return Array.from(clienteMap.entries())
      .filter(([nome]) => nome.toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => b[1].total - a[1].total)
  }, [clienteMap, busca])

  const clienteAtivo = historico ? clienteMap.get(historico) : null

  return (
    <>
      <style>{css}</style>
      <div className="clientes-page">
        <div className="clientes-header">
          <div className="search-box">
            <Search size={15} className="search-icon" />
            <input placeholder="Buscar cliente ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>{lista.length} clientes</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th>Pedidos</th>
                <th>Valor Total</th>
                <th>Última Compra</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map(([nome, d]) => (
                <tr key={nome}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar-sm">{iniciais(nome)}</div>
                      <span style={{ fontWeight: 600 }}>{nome}</span>
                    </div>
                  </td>
                  <td>
                    {d.telefone ? (
                      <a className="wa-link" href={`https://wa.me/${d.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer">
                        <Phone size={12} /> {d.telefone}
                      </a>
                    ) : '—'}
                  </td>
                  <td><span style={{ fontWeight: 700 }}>{d.pedidos.length}</span></td>
                  <td><span style={{ color: '#F58226', fontWeight: 700 }}>{fmtMoeda(d.total)}</span></td>
                  <td style={{ color: '#999', fontSize: 12 }}>{d.ultima ? fmtData(d.ultima) : '—'}</td>
                  <td>
                    <button className="btn-hist" onClick={() => setHistorico(nome)}>Ver histórico</button>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr><td colSpan={6} className="empty">Nenhum cliente encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {historico && clienteAtivo && (
        <>
          <div className="drawer-overlay" onClick={() => setHistorico(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <div>
                <div className="drawer-title">{historico}</div>
                <div className="drawer-sub">{clienteAtivo.pedidos.length} pedidos · {fmtMoeda(clienteAtivo.total)} total</div>
              </div>
              <div className="drawer-close" onClick={() => setHistorico(null)}><X size={16} /></div>
            </div>
            <div className="drawer-body">
              {clienteAtivo.pedidos.sort((a,b) => b.created_at.localeCompare(a.created_at)).map(p => (
                <div key={p.id} className="hist-card">
                  <div className="hist-card-top">
                    <span className="hist-date"><Clock size={11} /> {fmtData(p.created_at)}</span>
                    <span className={`hist-status ${p.status === 'finalizado' ? 'status-fin' : p.status === 'aguardando_registro' ? 'status-ag' : 'status-em'}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  {(p.itens || []).map((it: { descricao: string; valor: number }, i: number) => (
                    <div key={i} className="hist-item">
                      <span>• {it.descricao}</span>
                      <span style={{ fontWeight: 600 }}>{fmtMoeda(it.valor)}</span>
                    </div>
                  ))}
                  <div className="hist-total">Total: {fmtMoeda(p.total || 0)}</div>
                  {p.veiculo_carro && (
                    <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                      🚗 {[p.veiculo_carro, p.veiculo_ano, p.veiculo_placa].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {p.forma_pagamento && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#FFF0E9', color: '#F58226' }}>
                        {(p.forma_pagamento || '').toUpperCase()}
                      </span>
                    )}
                    {p.forma_entrega && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#EDE7F6', color: '#4527A0' }}>
                        {(p.forma_entrega || '').charAt(0).toUpperCase() + (p.forma_entrega || '').slice(1)}
                      </span>
                    )}
                    {p.vendedor && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#E8F5E9', color: '#2E7D32' }}>
                        👤 {p.vendedor}
                      </span>
                    )}
                    {p.endereco_entrega && (
                      <span style={{ fontSize: 10, color: '#888' }}>📍 {p.endereco_entrega}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
