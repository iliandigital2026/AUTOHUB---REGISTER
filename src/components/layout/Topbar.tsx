import { Bell, Sun, Moon } from 'lucide-react'
import type { PageName } from '../../types'
import { useUserRole } from '../../hooks/useUserRole'

const PAGE_TITLES: Record<string, string> = {
  dashboard:     'Dashboard',
  kanban:        'Pedidos — Kanban',
  clientes:      'Clientes',
  followup:      'Follow-up & Alertas',
  vendedores:    'Gestão de Vendedores',
  relatorios:    'Relatórios por Vendedor',
  configuracoes: 'Integrações N8N',
  estoque:       'Estoque de Peças',
  lixeira:       'Lixeira',
}

interface Props {
  page: PageName
  n8nOnline: boolean
  toasts: string[]
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

const style = `
  .topbar {
    background: var(--topbar-bg); border-bottom: 1px solid var(--topbar-border); padding: 0 24px;
    height: 56px; display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 10;
  }
  .topbar-title { font-size: 15px; font-weight: 700; color: var(--text-primary); font-family: 'Montserrat', sans-serif; }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .n8n-badge {
    display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600;
    padding: 5px 12px; border-radius: 20px; font-family: 'Montserrat', sans-serif;
  }
  .n8n-badge.online { background: var(--bg-success); color: var(--color-success); }
  .n8n-badge.offline { background: var(--bg-input); color: var(--text-muted); }
  .n8n-dot { width: 7px; height: 7px; border-radius: 50%; }
  .n8n-badge.online .n8n-dot { background: #2E7D32; animation: pulse-dot 2s infinite; }
  .n8n-badge.offline .n8n-dot { background: #ddd; }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
  }
  .topbar-icon-btn {
    width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-color);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-muted); transition: all 0.15s;
    background: transparent;
  }
  .topbar-icon-btn:hover { background: var(--nav-hover-bg); color: var(--brand-orange); border-color: var(--brand-orange); }
  .toast-container {
    position: fixed; bottom: 24px; right: 24px; z-index: 999;
    display: flex; flex-direction: column; gap: 8px; pointer-events: none;
  }
  .toast {
    background: var(--text-primary); color: #fff; font-size: 13px; font-weight: 500;
    padding: 12px 18px; border-radius: 10px; max-width: 320px;
    border-left: 4px solid #F58226; animation: slideIn 0.3s ease;
    font-family: 'Montserrat', sans-serif;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }
  @keyframes slideIn { from { transform: translateX(110px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`

export default function Topbar({ page, n8nOnline, toasts, theme, onToggleTheme }: Props) {
  const { role } = useUserRole()
  const isSuporte = role === 'suporte'

  return (
    <>
      <style>{style}</style>
      <header className="topbar">
        <div className="topbar-title">{PAGE_TITLES[page] || page}</div>
        <div className="topbar-right">
          {isSuporte && (
            <div className={`n8n-badge ${n8nOnline ? 'online' : 'offline'}`}>
              <div className="n8n-dot" />
              N8N {n8nOnline ? 'Conectado' : 'Offline'}
            </div>
          )}
          <button className="topbar-icon-btn" onClick={onToggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <div className="topbar-icon-btn"><Bell size={15} /></div>
        </div>
      </header>
      <div className="toast-container">
        {toasts.map((t, i) => <div key={i} className="toast">🔔 {t}</div>)}
      </div>
    </>
  )
}
