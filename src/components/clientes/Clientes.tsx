import { useState, useMemo } from 'react'
import { Search, X, Clock, Phone, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Pedido } from '../../types'

interface Props { pedidos: Pedido[] }

const css = `
  .clientes-page { padding: 24px; }
  .clientes-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .search-box { flex: 1; position: relative; max-width: 360px; }
  .search-box input { width: 100%; padding: 9px 14px 9px 36px; border: 0.5px solid var(--border-card); border-radius: 10px; font-family: 'Montserrat',sans-serif; font-size: 13px; background: var(--bg-card); color: var(--text-primary); outline: none; }
  .search-box input:focus { border-color: #F58226; }
  .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
  .table-wrap { background: var(--bg-card); border: 0.5px solid var(--border-card); border-radius: 12px; overflow: hidden; }
  .table-wrap table { width: 100%; border-collapse: collapse; }
  .table-wrap th { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; padding: 12px 16px; background: var(--bg-table-head); border-bottom: 0.5px solid var(--border-card); text-align: left; }
  .table-wrap td { font-size: 13px; color: var(--text-primary); padding: 12px 16px; border-bottom: 0.5px solid var(--border-color); vertical-align: middle; }
  .table-wrap tr:last-child td { border-bottom: none; }
  .table-wrap tr:hover td { background: var(--bg-card)AF8; }
  .avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-card)0E9; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #F58226; flex-shrink: 0; }
  .btn-hist { background: var(--bg-card)0E9; color: #F58226; border: 0.5px solid #F5822640; border-radius: 8px; padding: 5px 12px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Montserrat',sans-serif; transition: background .15s; }
  .btn-hist:hover { background: #F58226; color: #fff; }
  .wa-link { display: inline-flex; align-items: center; gap: 5px; color: var(--color-success); font-size: 12px; font-weight: 600; text-decoration: none; }
  .wa-link:hover { text-decoration: underline; }
  .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100; }
  .drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 420px; background: var(--bg-card); z-index: 101; box-shadow: -4px 0 24px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
  .drawer-header { padding: 20px 24px; border-bottom: 0.5px solid var(--border-card); display: flex; align-items: center; justify-content: space-between; }
  .drawer-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
  .drawer-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .drawer-close { width: 32px; height: 32px; border-radius: 8px; border: 0.5px solid var(--border-card); background: var(--bg-input); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); }
  .drawer-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
  .hist-card { border: 0.5px solid var(--border-card); border-radius: 10px; padding: 14px; margin-bottom: 12px; }
  .hist-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .hist-date { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
  .hist-status { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
  .status-fin { background: var(--bg-success); color: var(--color-success); }
  .status-ag { background: var(--bg-warning); color: var(--color-warning); }
  .status-em { background: var(--bg-card)0E9; color: #F58226; }
  .hist-item { font-size: 12px; color: var(--text-secondary); margin-bottom: 3px; display: flex; justify-content: space-between; }
  .hist-total { font-size: 13px; font-weight: 700; color: #F58226; margin-top: 8px; }
  .empty { text-align: center; padding: 48px; color: var(--text-muted); font-size: 13px; }
  .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
`

function iniciais(n: string) {
  return n.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
}

function fmtMoeda(v: unknown) {
  return (parseFloat(String(v)) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

function parseItens(itens: unknown): { descricao: string; valor: number }[] {
  if (!itens) return []
  let arr: unknown[] = []
  if (Array.isArray(itens)) {
    arr = itens
  } else if (typeof itens === 'string') {
    try { arr = JSON.parse(itens) } catch { return [{ descricao: itens, valor: 0 }] }
  }
  return arr.map((it: unknown) =>
    typeof it === 'string'
      ? { descricao: it, valor: 0 }
      : { descricao: (it as { descricao?: string }).descricao || '', valor: (it as { valor?: number }).valor || 0 }
  )
}

const STATUS_LABEL: Record<string, string> = {
  finalizado: 'Finalizado',
  aguardando_registro: 'Aguardando',
  em_atendimento: 'Em atendimento',
  nao_finalizado: 'Nao Finalizado',
}

export default function Clientes({ pedidos }: Props) {
  const [busca, setBusca] = useState('')
  const [historico, setHistorico] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<string | null>(null)

  const moverLixeira = async (id: string) => {
    if (!confirm('Mover este pedido para a lixeira?')) return
    setRemovendo(id)
    await supabase.from('pedidos').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setRemovendo(null)
    window.location.reload()
  }

  const clienteMap = useMemo(() => {
    const map = new Map<string, { telefone: string; pedidos: Pedido[]; total: number; ultima: string }>()
    pedidos.forEach(p => {
      const ex = map.get(p.cliente_nome) || { telefone: p.cliente_telefone, pedidos: [], total: 0, ultima: '' }
      map.set(p.cliente_nome, {
        telefone: p.cliente_telefone || ex.telefone,
        pedidos: [...ex.pedidos, p],
        total: ex.total + (parseFloat(String(p.total)) || 0),
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
            <input
              placeholder="Buscar cliente ou telefone..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{lista.length} clientes</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th>Pedidos</th>
                <th>Valor Total</th>
                <th>Ultima Compra</th>
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
                      <a
                        className="wa-link"
                        href={`https://wa.me/${d.telefone.replace(/\D/g,'')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Phone size={12} /> {d.telefone}
                      </a>
                    ) : '-'}
                  </td>
                  <td><span style={{ fontWeight: 700 }}>{d.pedidos.length}</span></td>
                  <td><span style={{ color: '#F58226', fontWeight: 700 }}>{fmtMoeda(d.total)}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.ultima ? fmtData(d.ultima) : '-'}</td>
                  <td>
                    <button className="btn-hist" onClick={() => setHistorico(nome)}>
                      Ver historico
                    </button>
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
                <div className="drawer-sub">
                  {clienteAtivo.pedidos.length} pedidos · {fmtMoeda(clienteAtivo.total)} total
                </div>
              </div>
              <div className="drawer-close" onClick={() => setHistorico(null)}>
                <X size={16} />
              </div>
            </div>
            <div className="drawer-body">
              {clienteAtivo.pedidos
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .map(p => {
                  const itens = parseItens(p.itens)
                  const statusClass = p.status === 'finalizado'
                    ? 'status-fin'
                    : p.status === 'aguardando_registro'
                    ? 'status-ag'
                    : 'status-em'

                  return (
                    <div key={p.id} className="hist-card">
                      <div className="hist-card-top">
                        <span className="hist-date">
                          <Clock size={11} /> {fmtData(p.created_at)}
                        </span>
                        <span className={`hist-status ${statusClass}`}>
                          {STATUS_LABEL[p.status] || p.status}
                        </span>
                      </div>

                      {itens.length === 0 ? (
                        <div className="hist-item" style={{ color: 'var(--text-label)' }}>Sem itens registrados</div>
                      ) : (
                        itens.map((it, i) => (
                          <div key={i} className="hist-item">
                            <span>• {(p as { marca_produto?: string }).marca_produto ? `${(p as { marca_produto?: string }).marca_produto} — ` : ''}{it.descricao}</span>
                            {it.valor > 0 && (
                              <span style={{ fontWeight: 600 }}>{fmtMoeda(it.valor)}</span>
                            )}
                          </div>
                        ))
                      )}

                      <div className="hist-total">Total: {fmtMoeda(p.total)}</div>

                      {p.veiculo_carro && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                          carro {[p.veiculo_carro, p.veiculo_ano, p.veiculo_placa].filter(Boolean).join(' · ')}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {p.forma_pagamento && (
                          <span className="badge" style={{ background: '#FFF0E9', color: '#F58226' }}>
                            {p.forma_pagamento.toUpperCase()}
                          </span>
                        )}
                        {p.forma_entrega && (
                          <span className="badge" style={{ background: 'var(--tag-purple-bg)', color: 'var(--tag-purple-text)' }}>
                            {p.forma_entrega.charAt(0).toUpperCase() + p.forma_entrega.slice(1)}
                          </span>
                        )}
                        {p.vendedor && (
                          <span className="badge" style={{ background: 'var(--bg-success)', color: 'var(--color-success)' }}>
                            👤 {p.vendedor}
                          </span>
                        )}
                        {p.endereco_entrega && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>📍 {p.endereco_entrega}</span>
                        )}
                        <button
                          onClick={() => moverLixeira(p.id)}
                          disabled={removendo === p.id}
                          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-danger)', border: '0.5px solid var(--color-danger)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'var(--color-danger)', cursor: 'pointer', opacity: removendo === p.id ? 0.6 : 1 }}
                        >
                          <Trash2 size={11} /> {removendo === p.id ? 'Removendo...' : 'Lixeira'}
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
