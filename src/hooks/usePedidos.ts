import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Pedido, PedidoStatus } from '../types'

export function usePedidos(companyId?: string | null) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPedidos = useCallback(async () => {
    if (!companyId) { setLoading(false); return }
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .is('deleted_at', null)
      .eq('company_id', companyId || '')
      .order('created_at', { ascending: false })
    if (!error && data) setPedidos(data as Pedido[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPedidos()

    const channel = supabase
      .channel('pedidos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchPedidos()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchPedidos])

  const atualizarStatus = useCallback(async (id: string, status: PedidoStatus, vendedor?: string) => {
    const updates: Partial<Pedido> = { status }
    if (vendedor !== undefined) updates.vendedor = vendedor
    const { data } = await supabase.from('pedidos').update(updates).eq('id', id).select().single()
    if (data) setPedidos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    return data
  }, [])

  return { pedidos, loading, fetchPedidos, atualizarStatus }
}

export function useVendedores() {
  const [vendedores, setVendedores] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    supabase.from('vendedores').select('*').eq('ativo', true).order('nome').then(({ data }) => {
      if (data) setVendedores(data)
    })
  }, [])

  return vendedores
}
