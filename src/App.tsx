import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './components/dashboard/Dashboard'
import KanbanBoard from './components/kanban/KanbanBoard'
import Clientes from './components/clientes/Clientes'
import FollowUp from './components/followup/FollowUp'
import Vendedores from './components/vendedores/Vendedores'
import Relatorios from './components/relatorios/Relatorios'
import Configuracoes from './components/configuracoes/Configuracoes'
import Login from './components/auth/Login'
import Lixeira from './components/lixeira/Lixeira'
import Estoque from './components/estoque/Estoque'
import { usePedidos, useVendedores } from './hooks/usePedidos'
import { useAuth } from './hooks/useAuth'
import { useCompany } from './hooks/useCompany'
import { useSoundNotification } from './hooks/useSoundNotification'
import type { PageName, PedidoStatus } from './types'
import { useTheme } from './hooks/useTheme'

const appCss = `
  .app-shell { display: flex; min-height: 100vh; background: #F6F6F6; }
  .app-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .app-content { flex: 1; overflow-y: auto; }
  .loading-screen { display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 14px; background: #F6F6F6; }
  .spinner { width: 36px; height: 36px; border: 3px solid #F58226; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const companyId = useCompany()
  const [page, setPage] = useState<PageName>('dashboard')
  const [toasts, setToasts] = useState<string[]>([])
  const [n8nOnline, setN8nOnline] = useState(false)
  const { pedidos, loading: pedidosLoading, atualizarStatus } = usePedidos(companyId)
  const vendedores = useVendedores(companyId)
  const { playNewOrder } = useSoundNotification()

  const pendingCount = pedidos.filter(p => p.status === 'aguardando_registro').length

  const addToast = useCallback((msg: string) => {
    setToasts(prev => [...prev, msg])
    setTimeout(() => setToasts(prev => prev.slice(1)), 4500)
  }, [])

  // Detect new orders via realtime
  const [prevLen, setPrevLen] = useState<number | null>(null)
  useEffect(() => {
    if (prevLen === null) { setPrevLen(pedidos.length); return }
    if (pedidos.length > prevLen) {
      const novo = pedidos[0]
      addToast(`Novo pedido — ${novo.cliente_nome}`)
      playNewOrder()
    }
    setPrevLen(pedidos.length)
  }, [pedidos.length])

  // N8N ping
  useEffect(() => {
    const url = import.meta.env.VITE_N8N_WEBHOOK_ATUALIZAR_STATUS as string
    if (!url || url.includes('SEU_N8N')) { setN8nOnline(false); return }
    const check = () => fetch(url, { method: 'HEAD' }).then(() => setN8nOnline(true)).catch(() => setN8nOnline(false))
    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

  const handleUpdate = async (id: string, status: PedidoStatus, vendedor?: string) => {
    return atualizarStatus(id, status, vendedor)
  }

  if (authLoading) {
    return (
      <>
        <style>{appCss}</style>
        <div className="loading-screen">
          <div className="spinner" />
          <span style={{ fontSize: 13, color: '#999', fontWeight: 500 }}>Verificando acesso...</span>
        </div>
      </>
    )
  }

  if (!user) return <Login />

  return (
    <>
      <style>{appCss}</style>
      <div className="app-shell">
        <Sidebar
          page={page}
          setPage={setPage}
          pendingCount={pendingCount}
          onSignOut={signOut}
          userEmail={user.email}
        />
        <div className="app-main">
          <Topbar page={page} n8nOnline={n8nOnline} toasts={toasts} theme={theme} onToggleTheme={toggleTheme} />
          <div className="app-content">
            {pedidosLoading ? (
              <div className="loading-screen" style={{ height: 300, background: 'transparent' }}>
                <div className="spinner" />
                <span style={{ fontSize: 13, color: '#999', fontWeight: 500 }}>Carregando dados...</span>
              </div>
            ) : (
              <>
                {page === 'dashboard'      && <Dashboard pedidos={pedidos} />}
                {page === 'kanban'         && <KanbanBoard pedidos={pedidos} vendedores={vendedores} onUpdate={handleUpdate} />}
                {page === 'clientes'       && <Clientes pedidos={pedidos} />}
                {page === 'followup'       && <FollowUp pedidos={pedidos} />}
                {page === 'vendedores'     && <Vendedores />}
                {page === 'relatorios'     && <Relatorios pedidos={pedidos} />}
                {page === 'configuracoes'  && <Configuracoes />}
                {page === 'lixeira'        && <Lixeira />}
                {page === 'estoque'       && <Estoque />}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
