import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('userEmail', data.email)
      localStorage.removeItem('isGuest')
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setError('Connection error. Is the server running?')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">🛋️</span>
          <h1>Spacio</h1>
          <p>Designer Portal</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <p className="error-msg">⚠️ {error}</p>}
          <button type="submit" className="btn-primary">Login</button>
        </form>
        <p className="login-hint">Register an account via the homepage or login if you already have one.</p>
        <button className="btn-back-landing" onClick={() => navigate('/')}>← Back to Spacio</button>
      </div>
    </div>
  )
}