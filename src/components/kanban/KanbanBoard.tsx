import { useState, useMemo } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core'
import { User, Clock, CheckCircle, ChevronDown } from 'lucide-react'
import type { Pedido, PedidoStatus } from '../../types'
import { atualizarStatusN8N } from '../../services/n8n'

interface Props {
  pedidos: Pedido[]
  vendedores: { id: string; nome: string }[]
  onUpdate: (id: string, status: PedidoStatus, vendedor?: string) => Promise<unknown>
}

const COLS: { id: PedidoStatus; label: string; cor: string; bordaTopo: string; bg: string }[] = [
  { id: 'em_atendimento', label: 'Em Atendimento', cor: '#F58226', bordaTopo: '#F58226', bg: '#FFF5F0' },
  { id: 'aguardando_registro', label: 'Aguardando Registro', cor: '#F59E0B', bordaTopo: '#F59E0B', bg: '#FFFBEB' },
  { id: 'finalizado', label: 'Finalizado / Registrado', cor: '#16A34A', bordaTopo: '#16A34A', bg: '#F0FDF4' },
]

const PGTO_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  pix: { bg: '#E8F5E9', color: '#2E7D32', label: 'PIX' },
  credito: { bg: '#E3F2FD', color: '#1565C0', label: 'Crédito' },
  debito: { bg: '#F3E5F5', color: '#6A1B9A', label: 'Débito' },
  dinheiro: { bg: '#FFF8E1', color: '#E65100', label: 'Dinheiro' },
}

function tempoDecorrido(dt: string) {
  const diff = Math.round((Date.now() - new Date(dt).getTime()) / 60000)
  if (diff < 1) return 'agora'
  if (diff < 60) return `há ${diff}min`
  const h = Math.floor(diff / 60)
  return `há ${h}h${diff % 60 > 0 ? ` ${diff % 60}min` : ''}`
}

function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Card({ pedido, vendedores, onUpdate, isDragging }: {
  pedido: Pedido
  vendedores: { id: string; nome: string }[]
  onUpdate: Props['onUpdate']
  isDragging?: boolean
}) {
  const [showVendedor, setShowVendedor] = useState(false)
  const badge = PGTO_BADGE[(pedido.forma_pagamento || '').toLowerCase()] || { bg: '#F0F0F0', color: '#666', label: pedido.forma_pagamento || '—' }
  const itensRaw = Array.isArray(pedido.itens) ? pedido.itens : []
  const itens = itensRaw.map((it: string | { descricao: string; valor: number }) =>
    typeof it === 'string' ? { descricao: it, valor: 0 } : (it || { descricao: '', valor: 0 })
  )

  const atribuirVendedor = async (nome: string) => {
    setShowVendedor(false)
    await onUpdate(pedido.id, pedido.status, nome)
    await atualizarStatusN8N({ pedidoId: pedido.id, status: pedido.status, vendedor: nome, clienteNome: pedido.cliente_nome, total: pedido.total })
  }

  const finalizar = async () => {
    await onUpdate(pedido.id, 'finalizado', pedido.vendedor || undefined)
    await atualizarStatusN8N({ pedidoId: pedido.id, status: 'finalizado', vendedor: pedido.vendedor || undefined, clienteNome: pedido.cliente_nome, total: pedido.total, formaPagamento: pedido.forma_pagamento })
  }

  const formaEntrega = ((pedido as { forma_entrega?: string }).forma_entrega || 'balcao').toLowerCase().trim()
  const entregaBadge = ENTREGA_BADGE[formaEntrega] || ENTREGA_BADGE['balcao']

  return (
    <div style={{
      background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 12, padding: '14px 16px',
      marginBottom: 10, cursor: 'grab', opacity: isDragging ? 0.5 : 1,
      boxShadow: isDragging ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
          {badge.label}
        </span>
        <span style={{ fontSize: 10, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} /> {tempoDecorrido(pedido.created_at)}
        </span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>
        {pedido.cliente_nome}
      </div>
      {(pedido as { marca_produto?: string }).marca_produto && (
        <div style={{ fontSize: 11, color: '#F58226', fontWeight: 600, marginBottom: 4 }}>
          {(pedido as { marca_produto?: string }).marca_produto}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ background: entregaBadge.bg, color: entregaBadge.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
          {entregaBadge.icon} {entregaBadge.label}
        </span>
      </div>
      {(pedido as { endereco_entrega?: string }).endereco_entrega && (
        <div style={{ fontSize: 11, color: '#555', background: '#F9F9F9', padding: '6px 10px', borderRadius: 8, marginBottom: 8, display: 'flex', gap: 6 }}>
          <span>📍</span>
          <span>{(pedido as { endereco_entrega?: string }).endereco_entrega}</span>
        </div>
      )}

      <div style={{ borderTop: '0.5px solid #F0F0F0', borderBottom: '0.5px solid #F0F0F0', padding: '8px 0', marginBottom: 8 }}>
        {itens.map((it: { descricao: string; valor: number }, i: number) => (
          <div key={i} style={{ fontSize: 11, color: '#555', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
            <span>• {it.descricao}</span>
            {it.valor > 0 && <span style={{ fontWeight: 600 }}>{fmtMoeda(it.valor)}</span>}
          </div>
        ))}
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>Total</span>
          <span style={{ color: '#F58226' }}>{fmtMoeda(pedido.total)} ✅</span>
        </div>
      </div>

      {pedido.cliente_telefone && (
        <div style={{ marginBottom: 8 }}>
          <a
            href={`https://wa.me/${pedido.cliente_telefone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#E8F5E9', color: '#2E7D32', fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 20, textDecoration: 'none',
              border: '0.5px solid #A5D6A7',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#2E7D32">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.856L.057 23.215a.75.75 0 0 0 .916.919l5.433-1.462A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.497-5.27-1.446l-.376-.222-3.894 1.048 1.065-3.787-.245-.389A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            {pedido.cliente_telefone}
          </a>
        </div>
      )}

      {(pedido.veiculo_carro || pedido.veiculo_placa) && (
        <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
          🚗 {[pedido.veiculo_carro, pedido.veiculo_ano, pedido.veiculo_motor].filter(Boolean).join(' / ')}
          {pedido.veiculo_placa && <span style={{ marginLeft: 6, background: '#F0F0F0', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{pedido.veiculo_placa}</span>}
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: 6 }}>
        <button
          onClick={() => setShowVendedor(!showVendedor)}
          style={{ width: '100%', background: '#F6F6F6', border: '0.5px solid #E0E0E0', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, color: pedido.vendedor ? '#F58226' : '#999', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat,sans-serif' }}
        >
          <User size={13} />
          {pedido.vendedor || 'Atribuir vendedor'}
          <ChevronDown size={12} style={{ marginLeft: 'auto' }} />
        </button>
        {showVendedor && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 8, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {vendedores.map(v => (
              <div key={v.id} onClick={() => atribuirVendedor(v.nome)}
                style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#1A1A1A', borderBottom: '0.5px solid #F5F5F5' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FFF0E9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {v.nome}
              </div>
            ))}
          </div>
        )}
      </div>

      {pedido.status !== 'finalizado' && (
        <button
          onClick={finalizar}
          style={{ width: '100%', background: '#E8F5E9', border: '0.5px solid #A5D6A7', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#2E7D32', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Montserrat,sans-serif' }}
        >
          <CheckCircle size={13} /> Marcar como Finalizado
        </button>
      )}
    </div>
  )
}

function DraggableCard({ pedido, vendedores, onUpdate }: { pedido: Pedido; vendedores: Props['vendedores']; onUpdate: Props['onUpdate'] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: pedido.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <Card pedido={pedido} vendedores={vendedores} onUpdate={onUpdate} isDragging={isDragging} />
    </div>
  )
}

function Column({ col, pedidos, vendedores, onUpdate }: {
  col: typeof COLS[0]
  pedidos: Pedido[]
  vendedores: Props['vendedores']
  onUpdate: Props['onUpdate']
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        borderRadius: 12, border: `0.5px solid ${col.bordaTopo}30`,
        borderTop: `3px solid ${col.bordaTopo}`, background: col.bg,
        padding: 14, minHeight: 500,
        outline: isOver ? `2px dashed ${col.bordaTopo}` : 'none',
        transition: 'outline 0.15s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: col.cor, textTransform: 'uppercase', letterSpacing: '.5px' }}>
            {col.label}
          </div>
          <span style={{ background: col.cor, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
            {pedidos.length}
          </span>
        </div>
        <div ref={setNodeRef} style={{ minHeight: 60 }}>
          {pedidos.map(p => (
            <DraggableCard key={p.id} pedido={p} vendedores={vendedores} onUpdate={onUpdate} />
          ))}
          {pedidos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#ccc', fontSize: 12 }}>
              Nenhum pedido aqui
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function KanbanBoard({ pedidos, vendedores, onUpdate }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const byStatus = useMemo(() => {
    const map: Record<string, Pedido[]> = { em_atendimento: [], aguardando_registro: [], finalizado: [] }
    pedidos.forEach(p => { if (map[p.status]) map[p.status].push(p) })
    return map
  }, [pedidos])

  const activeCard = activeId ? pedidos.find(p => p.id === activeId) : null

  const onDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const newStatus = over.id as PedidoStatus
    const pedido = pedidos.find(p => p.id === active.id)
    if (!pedido || pedido.status === newStatus) return
    await onUpdate(pedido.id, newStatus)
    await atualizarStatusN8N({ pedidoId: pedido.id, status: newStatus, clienteNome: pedido.cliente_nome })
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>
          💡 Arraste os cards entre as colunas ou use os botões para atualizar o status
        </span>
      </div>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {COLS.map(col => (
            <Column key={col.id} col={col} pedidos={byStatus[col.id] || []} vendedores={vendedores} onUpdate={onUpdate} />
          ))}
        </div>
        <DragOverlay>
          {activeCard && (
            <div style={{ opacity: 0.9, transform: 'rotate(2deg)' }}>
              <Card pedido={activeCard} vendedores={vendedores} onUpdate={onUpdate} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
