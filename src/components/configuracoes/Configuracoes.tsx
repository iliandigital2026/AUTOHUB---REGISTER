import { useState } from 'react'
import { Save, TestTube, CheckCircle, XCircle, Copy, ExternalLink, Info } from 'lucide-react'

const WEBHOOKS = [
  {
    key: 'VITE_N8N_WEBHOOK_ATUALIZAR_STATUS',
    label: 'Webhook — Atualizar Status',
    desc: 'Disparado quando um pedido é movido no Kanban ou finalizado. Envie confirmação ao cliente via WhatsApp.',
    placeholder: 'https://seu-n8n.com/webhook/atualizar-status',
    payload: `{
  "pedidoId": "uuid",
  "status": "finalizado",
  "vendedor": "João Silva",
  "clienteNome": "Oficina São Paulo",
  "total": 150.00,
  "formaPagamento": "pix",
  "timestamp": "2025-05-13T14:32:00Z"
}`,
  },
  {
    key: 'VITE_N8N_WEBHOOK_FOLLOW_UP',
    label: 'Webhook — Follow-up',
    desc: 'Disparado ao clicar em "Follow-up" na tela de alertas. Envia mensagem automática ao cliente no WhatsApp.',
    placeholder: 'https://seu-n8n.com/webhook/follow-up',
    payload: `{
  "pedidoId": "uuid",
  "clienteTelefone": "5562999990001",
  "acao": "reenviar_mensagem",
  "timestamp": "2025-05-13T14:32:00Z"
}`,
  },
]

const SUPABASE_PAYLOAD = `POST https://SEU_PROJETO.supabase.co/rest/v1/pedidos
Headers:
  apikey: SUA_ANON_KEY
  Authorization: Bearer SUA_ANON_KEY
  Content-Type: application/json
  Prefer: return=minimal

Body:
{
  "cliente_nome": "{{ cliente_nome }}",
  "cliente_telefone": "{{ cliente_telefone }}",
  "veiculo_carro": "{{ veiculo_carro }}",
  "veiculo_ano": "{{ veiculo_ano }}",
  "veiculo_motor": "{{ veiculo_motor }}",
  "veiculo_placa": "{{ veiculo_placa }}",
  "itens": {{ itens_json }},
  "total": {{ total }},
  "forma_pagamento": "{{ forma_pagamento }}",
  "status": "aguardando_registro",
  "started_at": "{{ started_at }}",
  "ended_at": "{{ ended_at }}"
}`

const css = `
  .config-page { padding: 24px; max-width: 800px; }
  .config-section { margin-bottom: 28px; }
  .config-section-title { font-size: 13px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; padding-bottom: 10px; border-bottom: 0.5px solid var(--border-card); }
  .wh-card { background: var(--bg-card); border: 0.5px solid var(--border-card); border-radius: 12px; padding: 20px; margin-bottom: 14px; }
  .wh-label { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
  .wh-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; }
  .wh-input-row { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
  .wh-input { flex: 1; padding: 10px 14px; border: 0.5px solid var(--border-card); border-radius: 9px; font-family: 'Montserrat',sans-serif; font-size: 12px; color: var(--text-primary); background: var(--bg-table-head); outline: none; }
  .wh-input:focus { border-color: #F58226; background: var(--bg-card); }
  .wh-input.saved { border-color: #A5D6A7; background: var(--bg-success); }
  .btn-test { background: var(--bg-input); color: var(--text-secondary); border: 0.5px solid var(--border-card); border-radius: 9px; padding: 10px 14px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Montserrat',sans-serif; display: flex; align-items: center; gap: 6px; white-space: nowrap; transition: all .15s; }
  .btn-test:hover { background: #F58226; color: #fff; border-color: #F58226; }
  .btn-save-wh { background: #F58226; color: #fff; border: none; border-radius: 9px; padding: 10px 16px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Montserrat',sans-serif; display: flex; align-items: center; gap: 6px; }
  .test-result { font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 7px; display: flex; align-items: center; gap: 5px; }
  .test-ok { background: var(--bg-success); color: var(--color-success); }
  .test-fail { background: var(--bg-danger); color: var(--color-danger); }
  .payload-block { background: var(--text-primary); color: #E8E8E8; border-radius: 10px; padding: 14px 16px; font-size: 11px; font-family: monospace; line-height: 1.7; overflow-x: auto; position: relative; }
  .copy-btn { position: absolute; top: 10px; right: 10px; background: #333; color: var(--text-label); border: none; border-radius: 6px; padding: 4px 8px; font-size: 10px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
  .copy-btn:hover { background: #F58226; color: #fff; }
  .info-box { background: var(--bg-card)8E1; border: 0.5px solid #F59E0B40; border-radius: 10px; padding: 14px 16px; font-size: 12px; color: #92400E; display: flex; gap: 10px; margin-bottom: 14px; }
  .env-list { background: var(--bg-input); border-radius: 10px; padding: 14px 16px; font-size: 12px; font-family: monospace; line-height: 2; }
  .env-row { display: flex; justify-content: space-between; align-items: center; }
  .env-key { color: #F58226; font-weight: 700; }
  .env-val { color: var(--text-secondary); }
`

export default function Configuracoes() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [testResults, setTestResults] = useState<Record<string, 'ok' | 'fail' | 'testing'>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  const handleChange = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }))
    setSaved(prev => ({ ...prev, [key]: false }))
  }

  const handleSave = (key: string) => {
    setSaved(prev => ({ ...prev, [key]: true }))
    alert(`URL salva localmente. Para persistir em produção, adicione como variável de ambiente na Vercel:\n\n${key}=${values[key]}`)
  }

  const handleTest = async (key: string) => {
    const url = values[key]
    if (!url) { alert('Cole a URL do webhook antes de testar.'); return }
    setTestResults(prev => ({ ...prev, [key]: 'testing' }))
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teste: true, origem: 'AutoGestão', timestamp: new Date().toISOString() }),
      })
      setTestResults(prev => ({ ...prev, [key]: 'ok' }))
    } catch {
      setTestResults(prev => ({ ...prev, [key]: 'fail' }))
    }
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <>
      <style>{css}</style>
      <div className="config-page">

        <div className="config-section">
          <div className="config-section-title">
            <span style={{ color: '#F58226' }}>⚡</span> Webhooks N8N
          </div>

          <div className="info-box">
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>As URLs dos webhooks são definidas nas variáveis de ambiente da Vercel. Use este painel para testar a conexão e visualizar os payloads que o sistema envia.</span>
          </div>

          {WEBHOOKS.map(wh => (
            <div key={wh.key} className="wh-card">
              <div className="wh-label">{wh.label}</div>
              <div className="wh-desc">{wh.desc}</div>
              <div className="wh-input-row">
                <input
                  className={`wh-input${saved[wh.key] ? ' saved' : ''}`}
                  placeholder={wh.placeholder}
                  value={values[wh.key] || ''}
                  onChange={e => handleChange(wh.key, e.target.value)}
                />
                <button className="btn-test" onClick={() => handleTest(wh.key)}>
                  <TestTube size={13} />
                  {testResults[wh.key] === 'testing' ? 'Testando...' : 'Testar'}
                </button>
                <button className="btn-save-wh" onClick={() => handleSave(wh.key)}>
                  <Save size={13} />
                </button>
              </div>

              {testResults[wh.key] === 'ok' && (
                <div className="test-result test-ok"><CheckCircle size={13} /> Webhook respondeu com sucesso!</div>
              )}
              {testResults[wh.key] === 'fail' && (
                <div className="test-result test-fail"><XCircle size={13} /> Falha — verifique a URL ou se o N8N está ativo.</div>
              )}

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                  Payload enviado pelo sistema:
                </div>
                <div className="payload-block">
                  <button className="copy-btn" onClick={() => copyText(wh.payload)}>
                    <Copy size={10} /> {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{wh.payload}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="config-section">
          <div className="config-section-title">
            <span style={{ color: '#F58226' }}>📥</span> N8N → Sistema (Inserir pedido)
          </div>
          <div className="wh-card">
            <div className="wh-label">Como o N8N envia pedidos para o Kanban</div>
            <div className="wh-desc">
              Configure um nó HTTP Request no N8N com as informações abaixo. O Supabase Realtime fará o card aparecer instantaneamente no Kanban.
            </div>
            <div className="payload-block">
              <button className="copy-btn" onClick={() => copyText(SUPABASE_PAYLOAD)}>
                <Copy size={10} /> {copied ? 'Copiado!' : 'Copiar'}
              </button>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{SUPABASE_PAYLOAD}</pre>
            </div>
          </div>
        </div>

        <div className="config-section">
          <div className="config-section-title">
            <span style={{ color: '#F58226' }}>🔑</span> Variáveis de Ambiente (Vercel)
          </div>
          <div className="wh-card">
            <div className="wh-desc" style={{ marginBottom: 12 }}>
              Acesse <strong>vercel.com → seu projeto → Settings → Environment Variables</strong> e adicione:
            </div>
            <div className="env-list">
              {[
                ['VITE_SUPABASE_URL', 'https://wyuhozopfyvpwsfsygqu.supabase.co'],
                ['VITE_SUPABASE_ANON_KEY', 'sb_publishable_4L53n3X9...'],
                ['VITE_N8N_WEBHOOK_ATUALIZAR_STATUS', 'https://seu-n8n.com/webhook/...'],
                ['VITE_N8N_WEBHOOK_FOLLOW_UP', 'https://seu-n8n.com/webhook/...'],
              ].map(([k, v]) => (
                <div key={k} className="env-row">
                  <span className="env-key">{k}</span>
                  <span className="env-val">{v}</span>
                </div>
              ))}
            </div>
            <a
              href="https://vercel.com" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: '#F58226', fontWeight: 700, textDecoration: 'none' }}
            >
              <ExternalLink size={13} /> Abrir Vercel Dashboard
            </a>
          </div>
        </div>

      </div>
    </>
  )
}
