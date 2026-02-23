import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDesign } from '../context/DesignContext'
import { X } from 'lucide-react'
import './AuthModal.css'

export default function AuthModal({ isOpen, onClose, initialView = 'choice' }) {
    const [view, setView] = useState(initialView)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { setRoom, setFurniture } = useDesign()

    if (!isOpen) return null

    const handleLogin = (e) => {
        e.preventDefault()
        if (username === 'designer' && password === 'furniture123') {
            localStorage.setItem('isLoggedIn', 'true')
            onClose()
            navigate('/dashboard')
        } else {
            setError('Invalid credentials. Please try again.')
        }
    }

    const handleGuest = () => {
        setRoom({ width: 4, length: 3, shape: 'Rectangle', wallColor: '#F5F5DC', floorColor: '#D2B48C' })
        setFurniture([])
        onClose()
        navigate('/room-setup')
    }

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={e => e.stopPropagation()}>
                <button className="btn-close" onClick={onClose}>
                    <X size={20} />
                </button>

                {view === 'choice' ? (
                    <div className="auth-choice-view">
                        <div className="auth-logo">
                            <span className="logo-icon">🛋️</span>
                            <h2>Start Your Design</h2>
                            <p>How would you like to continue?</p>
                        </div>

                        <div className="auth-options">
                            <button className="auth-btn-primary" onClick={() => setView('login')}>
                                Log In / Sign Up
                            </button>
                            <div className="auth-divider">
                                <span>or</span>
                            </div>
                            <button className="auth-btn-guest" onClick={handleGuest}>
                                Continue as Guest (Demo Mode)
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="auth-login-view">
                        <div className="auth-logo">
                            <span className="logo-icon">🛋️</span>
                            <h2>Welcome Back</h2>
                            <p>Sign in to save your designs</p>
                        </div>
                        <form onSubmit={handleLogin} className="auth-form">
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
                            <button type="submit" className="auth-btn-primary">Log In</button>
                        </form>
                        <p className="auth-hint">Demo — Username: <strong>designer</strong> · Password: <strong>furniture123</strong></p>

                        {initialView === 'choice' && (
                            <button className="auth-btn-back" onClick={() => { setView('choice'); setError(''); }}>
                                ← Back to options
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
