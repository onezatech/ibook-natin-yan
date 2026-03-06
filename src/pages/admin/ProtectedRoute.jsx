import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../firebase/firebase'

export default function ProtectedRoute({ children }) {
    const navigate = useNavigate()
    const [checking, setChecking] = useState(true)
    const [authed, setAuthed] = useState(false)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, user => {
            if (user) {
                setAuthed(true)
            } else {
                navigate('/admin/login', { replace: true })
            }
            setChecking(false)
        })
        return unsub
    }, [navigate])

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #2D1B4E 40%, #1A2E2E 100%)' }}>
                <div className="text-center">
                    <div className="text-5xl animate-bounce mb-4">🔐</div>
                    <p className="text-white/60 font-semibold">Checking access…</p>
                </div>
            </div>
        )
    }

    return authed ? children : null
}
