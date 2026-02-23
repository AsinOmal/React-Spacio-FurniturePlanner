import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    if (username === 'designer' && password === 'furniture123') {
      localStorage.setItem('isLoggedIn', 'true')
      navigate('/dashboard')
    } else {
      setError('Invalid credentials. Please try again.')
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
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              placeholder="Enter your username"
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
        <p className="login-hint">Demo — Username: <strong>designer</strong> · Password: <strong>furniture123</strong></p>
        <button className="btn-back-landing" onClick={() => navigate('/')}>← Back to Spacio</button>
      </div>
    </div>
  )
}