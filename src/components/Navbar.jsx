import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sun, Moon, Plus, LogOut } from 'lucide-react'
import { useDesign } from '../context/DesignContext'
import AuthModal from './AuthModal'
import './Navbar.css'

export default function Navbar() {
    const navigate = useNavigate()
    const location = useLocation()

    // Custom design context for Dashboard new design click
    const { setRoom, setFurniture } = useDesign()

    const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'

    const [authOpen, setAuthOpen] = useState(false)

    const isDashboard = location.pathname === '/dashboard'

    const toggleDark = () => {
        const next = !dark
        document.documentElement.classList.toggle('dark', next)
        localStorage.setItem('spacio-dark', next ? '1' : '0')
        setDark(next)
    }

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn')
        navigate('/')
    }

    const handleNew = () => {
        setRoom({ width: 4, length: 3, shape: 'Rectangle', wallColor: '#F5F5DC', floorColor: '#D2B48C' })
        setFurniture([])
        navigate('/room-setup')
    }

    return (
        <nav className="sp-nav">
            <span className="sp-logo" onClick={() => navigate('/')}>Spacio</span>

            {isDashboard && (
                <div className="sp-nav-links">
                    <button className="sp-nav-link sp-nav-active">My Designs</button>
                    <button className="sp-nav-link" onClick={() => navigate('/')}>Home</button>
                </div>
            )}

            <div className="sp-nav-right">
                <button className="sp-dark-toggle" onClick={toggleDark} title="Dark mode" aria-label="Toggle dark mode">
                    {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {isDashboard ? (
                    <>
                        <button className="sp-btn-new" onClick={handleNew}>
                            <Plus size={16} /> New Design
                        </button>
                        <button className="sp-btn-ghost-sm" onClick={handleLogout}>
                            <LogOut size={16} /> Sign Out
                        </button>
                    </>
                ) : (
                    loggedIn ? (
                        <>
                            <button className="sp-btn-ghost-sm" onClick={() => navigate('/dashboard')}>
                                My Designs
                            </button>
                            <button className="sp-btn-signin" onClick={handleLogout}>
                                Log Out
                            </button>
                        </>
                    ) : (
                        <button className="sp-btn-signin" onClick={() => setAuthOpen(true)}>
                            Sign In
                        </button>
                    )
                )}
            </div>
            <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialView="login" />
        </nav>
    )
}
