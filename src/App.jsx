import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DesignProvider } from './context/DesignContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RoomSetup from './pages/RoomSetup'
import Editor2D from './pages/Editor2D'
import Preview3D from './pages/Preview3D'

function PrivateRoute({ children }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  return isLoggedIn ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <DesignProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/room-setup" element={<PrivateRoute><RoomSetup /></PrivateRoute>} />
          <Route path="/editor" element={<PrivateRoute><Editor2D /></PrivateRoute>} />
          <Route path="/preview3d" element={<PrivateRoute><Preview3D /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </DesignProvider>
  )
}