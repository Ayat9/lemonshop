import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './AppShell.css'

const NAV = [
  { to: '/', label: 'Dashboard', perm: 'dashboard', end: true },
  { to: '/tasks', label: 'Задачи', perm: 'tasks', soon: true },
  { to: '/employees', label: 'Сотрудники', perm: 'employees', soon: true },
  { to: '/tactical', label: 'Тактическая доска', perm: 'tactical', soon: true },
  { to: '/org', label: 'Структура', perm: 'org', soon: true },
]

export default function AppShell() {
  const { currentUser, currentRole, logout, hasPermission } = useApp()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <span className="app-logo">Lemonshop</span>
          <span className="app-header-sub">Управление сетью</span>
        </div>
        <div className="app-header-user">
          <span className="app-user-name">{currentUser?.name}</span>
          <span className="app-role-badge">{currentRole?.name}</span>
          <button type="button" className="app-btn-ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <nav className="app-nav">
            {NAV.filter((item) => hasPermission(item.perm)).map((item) =>
              item.soon ? (
                <span key={item.to} className="app-nav-link app-nav-link--disabled" title="Следующий этап">
                  {item.label}
                </span>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `app-nav-link ${isActive ? 'app-nav-link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>
        </aside>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
