export const TASK_STATUS = {
  new: 'new',
  inProgress: 'in_progress',
  review: 'review',
  done: 'done',
}

export const TASK_STATUS_LABELS = {
  new: 'Новая',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Выполнена',
  overdue: 'Просрочена',
}

/** Эффективный статус с учётом просрочки по сроку */
export function effectiveTaskStatus(task, now = new Date()) {
  if (task.status === TASK_STATUS.done) return TASK_STATUS.done
  if (!task.dueDate) return task.status || TASK_STATUS.new
  const due = new Date(`${task.dueDate}T23:59:59`)
  if (due < now) return 'overdue'
  return task.status || TASK_STATUS.new
}

export function isOverdue(task, now = new Date()) {
  return effectiveTaskStatus(task, now) === 'overdue'
}

export function parseDueSoon(task, days = 3, now = new Date()) {
  if (!task.dueDate || task.status === TASK_STATUS.done) return false
  const due = new Date(`${task.dueDate}T23:59:59`)
  if (due < now) return false
  const limit = new Date(now)
  limit.setDate(limit.getDate() + days)
  return due <= limit
}

export function computeDashboardMetrics(tasks, employees = [], now = new Date()) {
  const list = tasks || []
  const overdue = list.filter((t) => isOverdue(t, now))
  const inProgress = list.filter((t) => effectiveTaskStatus(t, now) === TASK_STATUS.inProgress)
  const onReview = list.filter((t) => effectiveTaskStatus(t, now) === TASK_STATUS.review)
  const done = list.filter((t) => {
    if (t.status !== TASK_STATUS.done) return false
    const updated = t.statusChangedAt || t.updatedAt || t.createdAt
    if (!updated) return true
    const d = new Date(updated)
    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)
    return d >= monthAgo
  })

  const attention = [...list]
    .filter((t) => t.status !== TASK_STATUS.done)
    .filter((t) => isOverdue(t, now) || parseDueSoon(t, 3, now))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 10)

  const topManagers = (employees || []).filter((e) => e.isTopManager)
  const loadByManager = topManagers.map((m) => ({
    employee: m,
    openCount: list.filter(
      (t) =>
        t.assigneeId === m.id &&
        t.status !== TASK_STATUS.done &&
        effectiveTaskStatus(t, now) !== 'overdue'
    ).length,
    overdueCount: list.filter(
      (t) => t.assigneeId === m.id && isOverdue(t, now)
    ).length,
  }))

  return {
    overdueCount: overdue.length,
    overdueTasks: overdue,
    inProgressCount: inProgress.length,
    onReviewCount: onReview.length,
    doneRecentCount: done.length,
    attentionTasks: attention,
    managerLoad: loadByManager,
  }
}
