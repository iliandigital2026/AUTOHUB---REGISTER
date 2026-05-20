export type PedidoStatus = 'em_atendimento' | 'aguardando_registro' | 'finalizado' | 'nao_finalizado'
export type FormaPagamento = 'pix' | 'credito' | 'debito' | 'dinheiro'

export interface ItemPedido {
  descricao: string
  valor: number
}

export interface Pedido {
  id: string
  created_at: string
  started_at: string
  ended_at: string
  cliente_nome: string
  cliente_telefone: string
  veiculo_carro: string
  veiculo_ano: string
  veiculo_motor: string
  veiculo_placa: string
  itens: ItemPedido[]
  total: number
  forma_pagamento: FormaPagamento
  status: PedidoStatus
  vendedor: string | null
  n8n_pedido_id: string | null
}

export interface Cliente {
  id: string
  nome: string
  telefone: string
  total_pedidos: number
  valor_acumulado: number
  ultima_compra: string | null
}

export interface Vendedor {
  id: string
  nome: string
  ativo: boolean
}

export type PageName = 'dashboard' | 'kanban' | 'clientes' | 'followup' | 'vendedores' | 'relatorios' | 'configuracoes'
