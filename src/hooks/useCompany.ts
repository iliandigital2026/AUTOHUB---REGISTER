import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      // Força refresh do token para pegar user_metadata atualizado
      const { data: refreshed } = await supabase.auth.refreshSession()
      const meta = refreshed.session?.user?.user_metadata
      if (meta?.company_id) {
        setCompanyId(meta.company_id)
        return
      }
      // Fallback: tenta pegar da sessão atual
      const { data } = await supabase.auth.getSession()
      const metaFallback = data.session?.user?.user_metadata
      if (metaFallback?.company_id) setCompanyId(metaFallback.company_id)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const meta = session?.user?.user_metadata
      if (meta?.company_id) setCompanyId(meta.company_id)
      else setCompanyId(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return companyId
}
