import { useMemo } from 'react'
import { AlertTriangle, Clock, CheckCircle, Send, Phone, XCircle } from 'lucide-react'
import type { Pedido } from '../../types'
import { dispararFollowUp } from '../../services/n8n'
import { supabase } from '../../lib/supabase'

interface Props { pedidos: Pedido[] }

const css = `
  .followup-page { padding: 24px; }
  .followup-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .fs-card { background: #fff; border: 0.5px solid #E0E0E0; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; }
  .fs-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .fs-val { font-size: 22px; font-weight: 700; color: #1A1A1A; }
  .fs-label { font-size: 11px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
  .followup-list { display: flex; flex-direction: column; gap: 10px; }
  .fu-card { background: #fff; border: 0.5px solid #E0E0E0; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
  .fu-badge { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
  .fu-urgente { background: #FFEBEE; color: #C62828; }
  .fu-moderado { background: #FFF8E1; color: #F57F17; }
  .fu-info { flex: 1; min-width: 0; }
  .fu-nome { font-size: 14px; font-weight: 700; color: #1A1A1A; margin-bottom: 3px; }
  .fu-detalhe { font-size: 12px; color: #888; }
  .fu-tempo { font-size: 12px; font-weight: 600; color: #F58226; white-space: nowrap; display: flex; align-items: center; gap: 5px; }
  .fu-actions { display: flex; gap: 8px; }
  .btn-sm { border-radius: 8px; padding: 7px 12px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Montserrat',sans-serif; display: flex; align-items: center; gap: 5px; border: none; transition: opacity .15s; }
  .btn-sm:hover { opacity: .85; }
  .btn-green { background: #E8F5E9; color: #2E7D32; }
  .btn-orange { background: #F58226; color: #fff; }
  .btn-wa { background: #E8F5E9; color: #2E7D32; }
  .btn-red { background: #FFEBEE; color: #C62828; }
  .empty-fu { text-align: center; padding: 64px; color: #bbb; font-size: 14px; }
  .empty-fu-icon { font-size: 40px; margin-bottom: 12px; }
  .section-title { font-size: 12px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .5px; margin: 20px 0 10px; }
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
      .filter(p => minutosDesde(p.created_at) >= 1320) // 22 horas
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [pedidos])

  const urgentes = pendentes.filter(p => minutosDesde(p.created_at) >= 2880) // +48h
  const moderados = pendentes.filter(p => {
    const m = minutosDesde(p.created_at)
    return m >= 1440 && m < 2880 // 24h-48h
  })
  const recentes = pendentes.filter(p => {
    const m = minutosDesde(p.created_at)
    return m >= 1320 && m < 1440 // 22h-24h
  })

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
            <div className="fs-icon" style={{ background: '#FFEBEE' }}>
              <AlertTriangle size={20} color="#C62828" />
            </div>
            <div>
              <div className="fs-val">{urgentes.length}</div>
              <div className="fs-label">Urgentes (+48h)</div>
            </div>
          </div>
          <div className="fs-card">
            <div className="fs-icon" style={{ background: '#FFF8E1' }}>
              <Clock size={20} color="#F57F17" />
            </div>
            <div>
              <div className="fs-val">{moderados.length}</div>
              <div className="fs-label">Moderados (24-48h)</div>
            </div>
          </div>
          <div className="fs-card">
            <div className="fs-icon" style={{ background: '#FFF0E9' }}>
              <Clock size={20} color="#F58226" />
            </div>
            <div>
              <div className="fs-val">{recentes.length}</div>
              <div className="fs-label">Recentes (22-24h)</div>
            </div>
          </div>
          <div className="fs-card">
            <div className="fs-icon" style={{ background: '#F5F5F5' }}>
              <XCircle size={20} color="#999" />
            </div>
            <div>
              <div className="fs-val">{naoFinalizados.length}</div>
              <div className="fs-label">Nao Finalizados</div>
            </div>
          </div>
        </div>

        {pendentes.length === 0 && naoFinalizados.length === 0 ? (
          <div className="empty-fu">
            <div className="empty-fu-icon">🎉</div>
            <div style={{ fontWeight: 700, color: '#1A1A1A', fontSize: 16, marginBottom: 6 }}>Tudo em dia!</div>
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
                        <span className="fu-badge" style={{ background: '#F5F5F5', color: '#999' }}>
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
          </>
        )}
      </div>
    </>
  )
}
