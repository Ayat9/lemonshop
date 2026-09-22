import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './Login.css'

export default function Login() {
  const { login, isAuthenticated } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('ceo@lemonshop.kz')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = login(email, password)
    if (result.ok) {
      setError('')
      navigate('/', { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Lemonshop HRM</h1>
        <p className="login-lead">Внутренняя система управления сотрудниками и задачами</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              required
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit">Войти</button>
        </form>
        <p className="login-hint">
          Демо: <strong>ceo@lemonshop.kz</strong> / <strong>admin123</strong>
        </p>
      </div>
    </div>
  )
}
