import { useMemo } from 'react'
import { AlertTriangle, Clock, CheckCircle, Send, Phone, XCircle } from 'lucide-react'
import type { Pedido } from '../../types'
import { dispararFollowUp } from '../../services/n8n'
import { supabase } from '../../lib/supabase'

interface Props { pedidos: Pedido[] }

const css = `
  .followup-page { padding: 24px; }
  .followup-summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
  .fs-card { background: var(--bg-card); border: 0.5px solid var(--border-card); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; }
  .fs-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .fs-val { font-size: 22px; font-weight: 700; color: var(--text-primary); }
  .fs-label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
  .followup-list { display: flex; flex-direction: column; gap: 10px; }
  .fu-card { background: var(--bg-card); border: 0.5px solid var(--border-card); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
  .fu-badge { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
  .fu-urgente { background: var(--bg-danger); color: var(--color-danger); }
  .fu-moderado { background: var(--bg-warning); color: var(--color-warning); }
  .fu-info { flex: 1; min-width: 0; }
  .fu-nome { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px; }
  .fu-detalhe { font-size: 12px; color: var(--text-muted); }
  .fu-tempo { font-size: 12px; font-weight: 600; color: #F58226; white-space: nowrap; display: flex; align-items: center; gap: 5px; }
  .fu-actions { display: flex; gap: 8px; }
  .btn-sm { border-radius: 8px; padding: 7px 12px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Montserrat',sans-serif; display: flex; align-items: center; gap: 5px; border: none; transition: opacity .15s; }
  .btn-sm:hover { opacity: .85; }
  .btn-green { background: var(--bg-success); color: var(--color-success); }
  .btn-orange { background: #F58226; color: #fff; }
  .btn-wa { background: var(--bg-success); color: var(--color-success); }
  .btn-red { background: var(--bg-danger); color: var(--color-danger); }
  .empty-fu { text-align: center; padding: 64px; color: var(--text-muted); font-size: 14px; }
  .empty-fu-icon { font-size: 40px; margin-bottom: 12px; }
  .section-title { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; margin: 20px 0 10px; }
`

function tempoSemResposta(dt: string) {
  const diff = Math.round((Date.now() - new Date(dt).getTime()) / 60000)
  if (diff < 60) return `${diff} min`
  const h = Math.floor(diff / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)} dia${Math.floor(h / 24) > 1 ? 's' : ''}`
}

function minutosDesde(dt: string) {
  return Math.round((Date.now() - new Date(dt).getTime()) / 60000)
}

export default function FollowUp({ pedidos }: Props) {
  const pendentes = useMemo(() => {
    return pedidos
      .filter(p => p.status === 'em_atendimento' || p.status === 'aguardando_registro')
      .filter(p => !(p as { deleted_at?: string }).deleted_at)
      .filter(p => minutosDesde(p.created_at) >= 480) // 8 horas
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [pedidos])

  const urgentes = pendentes.filter(p => minutosDesde(p.created_at) >= 2880) // +48h
  const moderados = pendentes.filter(p => {
    const m = minutosDesde(p.created_at)
    return m >= 1440 && m < 2880 // 24h-48h
  })
  const recentes = pendentes.filter(p => {
    const m = minutosDesde(p.created_at)
    return m >= 480 && m < 1440 // 8h-24h
  })

  // Clientes inativos — 2+ dias sem comprar, baseado na ultima compra concluida
  const clientesInativos = useMemo(() => {
    const compras = pedidos.filter(p => (p.status === 'finalizado' || p.status === 'concluido') && !(p as { deleted_at?: string }).deleted_at)
    const porCliente = new Map<string, { nome: string; telefone: string; ultimaCompra: string }>()
    compras.forEach(p => {
      const chave = p.cliente_telefone || p.cliente_nome
      const atual = porCliente.get(chave)
      if (!atual || new Date(p.created_at) > new Date(atual.ultimaCompra)) {
        porCliente.set(chave, { nome: p.cliente_nome, telefone: p.cliente_telefone, ultimaCompra: p.created_at })
      }
    })
    return Array.from(porCliente.values())
      .map(c => ({ ...c, dias: Math.floor((Date.now() - new Date(c.ultimaCompra).getTime()) / (1000 * 60 * 60 * 24)) }))
      .filter(c => c.dias >= 2)
      .sort((a, b) => b.dias - a.dias)
  }, [pedidos])

  const naoFinalizados = pedidos.filter(p => p.status === 'nao_finalizado')

  const handleFollowUp = async (p: Pedido) => {
    await dispararFollowUp(p.id, p.cliente_telefone)
    alert(`Follow-up enviado para ${p.cliente_nome} via N8N!`)
  }

  const marcarNaoFinalizado = async (p: Pedido) => {
    if (!confirm(`Marcar pedido de ${p.cliente_nome} como "Não Finalizado"?`)) return
    await supabase.from('pedidos').update({ status: 'nao_finalizado' }).eq('id', p.id)
    alert(`Pedido marcado como Não Finalizado!`)
  }

  return (
    <>
      <style>{css}</style>
      <div className="followup-page">
        <div className="followup-summary">
          <div className="fs-card">
            <div className="fs-icon" style={{ background: 'var(--bg-danger)' }}>
              <AlertTriangle size={20} color="var(--color-danger)" />
            </div>
            <div>
              <div className="fs-val">{urgentes.length}</div>
              <div className="fs-label">Urgentes (+48h)</div>
            </div>
          </div>
          <div className="fs-card">
            <div className="fs-icon" style={{ background: 'var(--bg-warning)' }}>
              <Clock size={20} color="var(--color-warning)" />
            </div>
            <div>
              <div className="fs-val">{moderados.length}</div>
              <div className="fs-label">Moderados (24-48h)</div>
            </div>
          </div>
          <div className="fs-card">
            <div className="fs-icon" style={{ background: 'var(--bg-brand-light)' }}>
              <Clock size={20} color="#F58226" />
            </div>
            <div>
              <div className="fs-val">{recentes.length}</div>
              <div className="fs-label">Recentes (8-24h)</div>
            </div>
          </div>
          <div className="fs-card">
            <div className="fs-icon" style={{ background: 'var(--bg-input)' }}>
              <XCircle size={20} color="var(--text-muted)" />
            </div>
            <div>
              <div className="fs-val">{naoFinalizados.length}</div>
              <div className="fs-label">Nao Finalizados</div>
            </div>
          </div>
          <div className="fs-card">
            <div className="fs-icon" style={{ background: 'var(--tag-purple-bg)' }}>
              <Clock size={20} color="var(--tag-purple-text)" />
            </div>
            <div>
              <div className="fs-val">{clientesInativos.length}</div>
              <div className="fs-label">Inativos (2+ dias)</div>
            </div>
          </div>
        </div>

        {pendentes.length === 0 && naoFinalizados.length === 0 && clientesInativos.length === 0 ? (
          <div className="empty-fu">
            <div className="empty-fu-icon">🎉</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16, marginBottom: 6 }}>Tudo em dia!</div>
            <div>Nenhum atendimento pendente de follow-up no momento.</div>
          </div>
        ) : (
          <>
            {pendentes.length > 0 && (
              <>
                <div className="section-title">Pendentes de follow-up</div>
                <div className="followup-list">
                  {pendentes.map(p => {
                    const mins = minutosDesde(p.created_at)
                    const urgente = mins >= 2880
                    const itens = Array.isArray(p.itens) ? p.itens : []
                    return (
                      <div key={p.id} className="fu-card">
                        <span className={`fu-badge ${urgente ? 'fu-urgente' : 'fu-moderado'}`}>
                          {urgente ? 'Urgente' : 'Moderado'}
                        </span>
                        <div className="fu-info">
                          <div className="fu-nome">{p.cliente_nome}</div>
                          <div className="fu-detalhe">
                            {itens.slice(0, 2).map((it: string | { descricao: string }) =>
                              typeof it === 'string' ? it : it.descricao
                            ).join(', ')}
                            {itens.length > 2 && ` +${itens.length - 2} itens`}
                            {p.veiculo_carro && ` · ${p.veiculo_carro} ${p.veiculo_ano}`}
                          </div>
                        </div>
                        <div className="fu-tempo">
                          <Clock size={13} /> ha {tempoSemResposta(p.created_at)}
                        </div>
                        <div className="fu-actions">
                          {p.cliente_telefone && (
                            <a
                              href={`https://wa.me/${p.cliente_telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-sm btn-wa"
                              style={{ textDecoration: 'none' }}
                            >
                              <Phone size={12} /> WA
                            </a>
                          )}
                          <button className="btn-sm btn-orange" onClick={() => handleFollowUp(p)}>
                            <Send size={12} /> Follow-up
                          </button>
                          <button className="btn-sm btn-green" onClick={() => alert('Pedido resolvido!')}>
                            <CheckCircle size={12} /> Resolver
                          </button>
                          <button className="btn-sm btn-red" onClick={() => marcarNaoFinalizado(p)}>
                            <XCircle size={12} /> Nao Finalizado
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {naoFinalizados.length > 0 && (
              <>
                <div className="section-title">Nao Finalizados</div>
                <div className="followup-list">
                  {naoFinalizados.map(p => {
                    const itens = Array.isArray(p.itens) ? p.itens : []
                    return (
                      <div key={p.id} className="fu-card" style={{ opacity: 0.7 }}>
                        <span className="fu-badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                          Nao Finalizado
                        </span>
                        <div className="fu-info">
                          <div className="fu-nome">{p.cliente_nome}</div>
                          <div className="fu-detalhe">
                            {itens.slice(0, 2).map((it: string | { descricao: string }) =>
                              typeof it === 'string' ? it : it.descricao
                            ).join(', ')}
                            {p.veiculo_carro && ` · ${p.veiculo_carro} ${p.veiculo_ano}`}
                          </div>
                        </div>
                        <div className="fu-tempo">
                          <Clock size={13} /> ha {tempoSemResposta(p.created_at)}
                        </div>
                        <div className="fu-actions">
                          {p.cliente_telefone && (
                            <a
                              href={`https://wa.me/${p.cliente_telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-sm btn-wa"
                              style={{ textDecoration: 'none' }}
                            >
                              <Phone size={12} /> WA
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {clientesInativos.length > 0 && (
              <>
                <div className="section-title">Clientes sem comprar ha 2+ dias</div>
                <div className="followup-list">
                  {clientesInativos.map(c => (
                    <div key={c.telefone || c.nome} className="fu-card">
                      <span className="fu-badge" style={{ background: 'var(--tag-purple-bg)', color: 'var(--tag-purple-text)' }}>
                        {c.dias} {c.dias === 1 ? 'dia' : 'dias'}
                      </span>
                      <div className="fu-info">
                        <div className="fu-nome">{c.nome}</div>
                        <div className="fu-detalhe">Ultima compra: {new Date(c.ultimaCompra).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div className="fu-actions">
                        {c.telefone && (
                          
                            href={`https://wa.me/${c.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-sm btn-wa"
                            style={{ textDecoration: 'none' }}
                          >
                            <Phone size={12} /> WA
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
