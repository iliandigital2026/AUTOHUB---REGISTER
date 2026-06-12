import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const meta = data.session?.user?.user_metadata
      if (meta?.company_id) setCompanyId(meta.company_id)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const meta = session?.user?.user_metadata
      if (meta?.company_id) setCompanyId(meta.company_id)
      else setCompanyId(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return companyId
}
