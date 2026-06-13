import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Tenta pegar do user_metadata primeiro
      const meta = session.user.user_metadata
      if (meta?.company_id) {
        setCompanyId(meta.company_id)
        return
      }

      // Fallback: busca na tabela empresas pelo email
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (empresa?.id) {
        setCompanyId(empresa.id)
        return
      }

      // Ultimo fallback: usa o proprio id do usuario
      setCompanyId(session.user.id)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { setCompanyId(null); return }
      const meta = session.user.user_metadata
      if (meta?.company_id) setCompanyId(meta.company_id)
      else setCompanyId(session.user.id)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return companyId
}
