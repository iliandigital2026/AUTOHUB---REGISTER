import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
grep -n "useUserRole" src/components/estoque/Estoque.tsx

export type UserRole = 'dono' | 'vendedor' | 'estoquista'

interface UserRoleData {
  role: UserRole
  vendedorId: string | null
  vendedorNome: string | null
  loading: boolean
}

export function useUserRole(): UserRoleData {
  const [data, setData] = useState<UserRoleData>({
    role: 'dono',
    vendedorId: null,
    vendedorNome: null,
    loading: true,
  })

  useEffect(() => {
    let mounted = true

    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (mounted) setData({ role: 'dono', vendedorId: null, vendedorNome: null, loading: false })
        return
      }

      const { data: vendedor } = await supabase
        .from('vendedores')
        .select('id, nome, role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!mounted) return

      if (!vendedor) {
        // Não está na tabela vendedores = é o Dono/Gerente
        setData({ role: 'dono', vendedorId: null, vendedorNome: null, loading: false })
      } else {
        setData({
          role: (vendedor.role as UserRole) || 'vendedor',
          vendedorId: vendedor.id,
          vendedorNome: vendedor.nome,
          loading: false,
        })
      }
    }

    fetchRole()

    return () => { mounted = false }
  }, [])

  return data
}
