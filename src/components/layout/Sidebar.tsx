import { LayoutDashboard, Kanban, Users, Bell, Settings, BarChart2, UserCog, LogOut, Trash2, Package } from 'lucide-react'
import type { PageName } from '../../types'
import { LogoFull } from './Logo'

interface Props {
  page: PageName
  setPage: (p: PageName) => void
  pendingCount: number
  onSignOut: () => void
  userEmail?: string
}

const NAV_MAIN = [
  { id: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'kanban',     label: 'Pedidos',        icon: Kanban },
  { id: 'clientes',   label: 'Clientes',       icon: Users },
  { id: 'followup',   label: 'Follow-up',      icon: Bell },
  { id: 'relatorios', label: 'Relatórios',     icon: BarChart2 },
  { id: 'lixeira',    label: 'Lixeira',        icon: Trash2 },
  { id: 'estoque',    label: 'Estoque',        icon: Package },
] as const

const NAV_CONFIG = [
  { id: 'vendedores',     label: 'Vendedores',       icon: UserCog },
  { id: 'configuracoes',  label: 'Integrações N8N',  icon: Settings },
] as const

const ADMIN_EMAIL = 'iliandigital2026@gmail.com'

const style = `
  .sidebar {
    width: 230px; min-height: 100vh; background: #FFFFFF;
    border-right: 1px solid #EEEEEE; display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh; overflow-y: auto;
  }
  .sidebar-logo {
    padding: 22px 18px 18px; border-bottom: 1px solid #F0F0F0;
  }
  .nav-section { padding: 14px 10px 4px; }
  .nav-label {
    font-size: 10px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; padding: 0 10px; margin-bottom: 6px; color: #CCCCCC;
    font-family: 'Montserrat', sans-serif;
  }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 9px 12px;
    border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;
    color: #666; transition: all 0.15s; margin-bottom: 2px;
    border-left: 3px solid transparent; font-family: 'Montserrat', sans-serif;
  }
  .nav-item:hover { background: #FFF3EC; color: #E8421F; }
  .nav-item.active {
    background: linear-gradient(90deg, #FFF3EC 0%, #FFF8F4 100%);
    color: #E8421F; border-left: 3px solid #F58226; font-weight: 600;
  }
  .nav-badge {
    background: linear-gradient(90deg, #F58226, #D62C27);
    color: #fff; font-size: 10px; font-weight: 700;
    padding: 2px 7px; border-radius: 10px; margin-left: auto;
  }
  .sidebar-bottom {
    margin-top: auto; padding: 12px 10px 16px; border-top: 1px solid #F0F0F0;
  }
  .user-row {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    border-radius: 8px; margin-bottom: 4px;
  }
  .user-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, #F58226, #D62C27);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .user-email {
    font-size: 11px; color: #999; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; flex: 1;
    font-family: 'Montserrat', sans-serif;
  }
  .signout-btn {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;
    color: #C62828; transition: background .15s; font-family: 'Montserrat', sans-serif;
  }
  .signout-btn:hover { background: #FFEBEE; }
`

export default function Sidebar({ page, setPage, pendingCount, onSignOut, userEmail }: Props) {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AG'

  return (
    <>
      <style>{style}</style>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <LogoFull variant="light" />
        </div>

        <div className="nav-section">
          <div className="nav-label">Principal</div>
          {NAV_MAIN.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              className={`nav-item${page === id ? ' active' : ''}`}
              onClick={() => setPage(id as PageName)}
            >
              <Icon size={16} />
              {label}
              {id === 'kanban' && pendingCount > 0 && (
                <span className="nav-badge">{pendingCount}</span>
              )}
            </div>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-label">Configurações</div>
          {NAV_CONFIG.filter(item => item.id !== 'configuracoes' || userEmail === ADMIN_EMAIL).map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              className={`nav-item${page === id ? ' active' : ''}`}
              onClick={() => setPage(id as PageName)}
            >
              <Icon size={16} />
              {label}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          {userEmail && (
            <div className="user-row">
              <div className="user-avatar">{initials}</div>
              <div className="user-email">{userEmail}</div>
            </div>
          )}
          <div className="signout-btn" onClick={onSignOut}>
            <LogOut size={14} /> Sair
          </div>
        </div>
      </aside>
    </>
  )
}