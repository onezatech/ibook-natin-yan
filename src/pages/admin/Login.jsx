import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase/firebase'

export default function AdminLogin() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signInWithEmailAndPassword(auth, email, password)
            navigate('/admin')
        } catch {
            setError('Invalid email or password. Please try again.')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8"
            style={{ background: 'linear-gradient(160deg, #E0F7FA 0%, #FFF9F0 60%, #F0FFF4 100%)' }}>

            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-teal-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-teal-200/50 border border-teal-100 w-full max-w-sm p-8"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-teal-300/40">
                        🏝️
                    </div>
                    <h1 className="font-display text-3xl text-slate-800">Admin Panel</h1>
                    <p className="text-slate-400 text-sm mt-1">Bohol We Go — Family Data</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-slate-600 font-bold text-sm mb-2">Email</label>
                        <input
                            type="email"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password with toggle */}
                    <div>
                        <label className="block text-slate-600 font-bold text-sm mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-12 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-teal-600 transition-colors rounded-xl hover:bg-teal-50"
                                aria-label={showPw ? 'Hide password' : 'Show password'}
                            >
                                {showPw ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-sm flex gap-2 items-center">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button type="submit"
                        className="w-full mt-2 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-teal-300/40 transition-all text-base disabled:opacity-50"
                        disabled={loading}>
                        {loading ? '⏳ Signing in…' : 'Sign In →'}
                    </button>
                </form>

                <p className="text-center text-slate-400 text-xs mt-6">
                    Admin access only 🛡️
                </p>
            </motion.div>
        </div>
    )
}
