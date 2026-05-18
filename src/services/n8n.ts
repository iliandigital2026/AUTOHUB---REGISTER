const WEBHOOK_STATUS = import.meta.env.VITE_N8N_WEBHOOK_ATUALIZAR_STATUS as string
const WEBHOOK_FOLLOWUP = import.meta.env.VITE_N8N_WEBHOOK_FOLLOW_UP as string

export async function atualizarStatusN8N(payload: {
  pedidoId: string
  status: string
  vendedor?: string
  clienteNome?: string
  total?: number
  formaPagamento?: string
}) {
  try {
    if (!WEBHOOK_STATUS || WEBHOOK_STATUS.includes('SEU_N8N')) return
    await fetch(WEBHOOK_STATUS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
    })
  } catch (e) {
    console.warn('N8N webhook não configurado ou offline:', e)
  }
}

export async function dispararFollowUp(pedidoId: string, telefone: string) {
  try {
    if (!WEBHOOK_FOLLOWUP || WEBHOOK_FOLLOWUP.includes('SEU_N8N')) return
    await fetch(WEBHOOK_FOLLOWUP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pedidoId,
        clienteTelefone: telefone,
        acao: 'reenviar_mensagem',
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (e) {
    console.warn('N8N follow-up webhook não configurado:', e)
  }
}
