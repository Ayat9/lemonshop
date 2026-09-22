import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { computeDashboardMetrics, TASK_STATUS_LABELS, effectiveTaskStatus } from '../utils/tasks'
import './Dashboard.css'

export default function Dashboard() {
  const { tasks, employees, currentUser } = useApp()
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)

  const metrics = useMemo(
    () => computeDashboardMetrics(tasks, employees),
    [tasks, employees]
  )

  const listTasks = showOverdueOnly ? metrics.overdueTasks : metrics.attentionTasks

  const formatDue = (d) => {
    if (!d) return '—'
    try {
      return new Date(`${d}T12:00:00`).toLocaleDateString('ru-KZ')
    } catch {
      return d
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-greeting">
            Добро пожаловать, {currentUser?.name}. Обзор задач сети и загрузки руководителей.
          </p>
        </div>
      </header>

      <div className="dashboard-stats">
        <button
          type="button"
          className="stat-card stat-card--danger"
          onClick={() => setShowOverdueOnly(true)}
        >
          <span className="stat-label">Просрочено</span>
          <span className="stat-value">{metrics.overdueCount}</span>
        </button>
        <div className="stat-card">
          <span className="stat-label">В работе</span>
          <span className="stat-value">{metrics.inProgressCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">На проверке</span>
          <span className="stat-value">{metrics.onReviewCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Выполнено за 30 дней</span>
          <span className="stat-value">{metrics.doneRecentCount}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <h2>{showOverdueOnly ? 'Просроченные задачи' : 'Требуют внимания'}</h2>
            {showOverdueOnly && (
              <button type="button" className="app-btn-ghost" onClick={() => setShowOverdueOnly(false)}>
                Показать все срочные
              </button>
            )}
          </div>
          {listTasks.length === 0 ? (
            <p className="dashboard-empty">
              {showOverdueOnly
                ? 'Просроченных задач нет — отлично.'
                : 'Пока нет задач. Модуль «Задачи» будет на следующем шаге.'}
            </p>
          ) : (
            <ul className="dashboard-task-list">
              {listTasks.map((t) => {
                const st = effectiveTaskStatus(t)
                return (
                  <li key={t.id} className={st === 'overdue' ? 'is-overdue' : ''}>
                    <div>
                      <strong>{t.title}</strong>
                      <span className="task-meta">
                        Срок: {formatDue(t.dueDate)} · {TASK_STATUS_LABELS[st] || st}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="dashboard-panel">
          <h2>Загрузка руководителей</h2>
          {metrics.managerLoad.length === 0 ? (
            <p className="dashboard-empty">
              Топ-менеджеры появятся после настройки сотрудников и тактической доски.
            </p>
          ) : (
            <ul className="dashboard-load-list">
              {metrics.managerLoad.map(({ employee, openCount, overdueCount }) => (
                <li key={employee.id}>
                  <span className="load-name">{employee.name}</span>
                  <span className="load-count">{openCount} открытых</span>
                  {overdueCount > 0 && (
                    <span className="load-overdue">{overdueCount} просроч.</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
