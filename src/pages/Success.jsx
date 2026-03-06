import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// Confetti pieces matching beach palette
function ConfettiBurst() {
    const colors = ['#87CEEB', '#00BCD4', '#F4C244', '#E84393', '#4CAF50', '#FF6B6B', '#ffffff']
    const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        color: colors[i % colors.length],
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${2 + Math.random() * 3}s`,
        size: `${6 + Math.random() * 10}px`,
        rotate: `${Math.random() * 360}deg`,
    }))
    return (
        <>
            {pieces.map(p => (
                <div key={p.id} className="confetti-piece" style={{
                    left: p.left, width: p.size, height: p.size,
                    backgroundColor: p.color,
                    animationDelay: p.delay, animationDuration: p.duration,
                    transform: `rotate(${p.rotate})`,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                }} />
            ))}
        </>
    )
}

const BG = 'linear-gradient(180deg, #87CEEB 0%, #4EB8D5 35%, #00BCD4 60%, #0097A7 75%, #F4C244 88%, #E8AC30 100%)'
const glass = {
    background: 'rgba(255,255,255,0.30)',
    backdropFilter: 'blur(14px)',
    border: '1.5px solid rgba(255,255,255,0.55)',
    boxShadow: '0 12px 40px rgba(0,100,160,0.12)',
    borderRadius: 28,
}

export default function Success() {
    const location = useLocation()
    const navigate = useNavigate()
    const count = location.state?.count || 1
    const submitterName = location.state?.submitterName || 'Ka-Familia'
    const shareUrl = window.location.origin
    const shareText = `I just submitted our family's travel info for the Bohol wedding 🏝️💍! Takes only a few minutes — fill yours out too: ${shareUrl}`

    const handleShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: 'Bohol We Go!', text: shareText, url: shareUrl }) }
            catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(shareText)
            alert('Link copied to clipboard!')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden"
            style={{ background: BG }}>

            <ConfettiBurst />

            {/* Decorative light blobs */}
            <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.20)' }} />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'rgba(244,194,68,0.20)' }} />

            {/* Floating palm decorations */}
            <div className="absolute top-6 right-6 text-5xl pointer-events-none select-none opacity-60">🌴</div>
            <div className="absolute top-10 left-6 text-4xl pointer-events-none select-none opacity-50">⛅</div>
            <div className="absolute bottom-10 left-8 text-3xl pointer-events-none select-none opacity-50">🌊</div>
            <div className="absolute bottom-8 right-8 text-3xl pointer-events-none select-none opacity-50">🐚</div>

            <div className="relative z-10 max-w-md w-full text-center">

                {/* Animated party icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="text-8xl mb-5 select-none">
                    🎉
                </motion.div>

                {/* Salamat heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-display text-4xl sm:text-5xl mb-4"
                    style={{ color: '#003D5B', textShadow: '0 2px 16px rgba(255,255,255,0.6)' }}>
                    Salamat, {submitterName}!
                </motion.h1>

                {/* Info card */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="p-7 mb-6"
                    style={glass}>

                    <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
                    <p className="font-bold text-xl mb-2" style={{ color: '#003D5B' }}>
                        We got info for{' '}
                        <span className="font-display text-2xl" style={{ color: '#0097A7' }}>{count}</span>
                        {' '}{count === 1 ? 'family member' : 'family members'}!
                    </p>
                    <p className="text-sm" style={{ color: 'rgba(0,61,91,0.65)' }}>
                        Ate Maleen will follow up soon.<br />
                        See you in Bohol! 🌴
                    </p>

                    {/* Divider */}
                    <div className="my-4" style={{ height: 1, background: 'rgba(0,188,212,0.2)' }} />

                    <div className="flex justify-center gap-6 text-sm font-semibold" style={{ color: '#0097A7' }}>
                        <span>✈️ Flights incoming</span>
                        <span>🏖️ Bohol awaits</span>
                        <span>💍 Love is in the air</span>
                    </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="space-y-3">
                    <button onClick={handleShare}
                        className="w-full font-bold text-base transition-all active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #00BCD4, #0097A7)',
                            color: '#fff', padding: '14px 24px', borderRadius: 18,
                            border: '2px solid rgba(255,255,255,0.4)',
                            boxShadow: '0 8px 24px rgba(0,188,212,0.35)', cursor: 'pointer'
                        }}>
                        📤 Share this with more family members
                    </button>
                    <button onClick={() => navigate('/')}
                        className="w-full font-bold text-sm transition-all active:scale-95"
                        style={{
                            background: 'rgba(255,255,255,0.35)', color: '#004D63',
                            padding: '12px 24px', borderRadius: 18,
                            border: '1.5px solid rgba(255,255,255,0.55)', cursor: 'pointer'
                        }}>
                        ← Back to Home
                    </button>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-xs mt-6 font-semibold"
                    style={{ color: 'rgba(0,61,91,0.5)' }}>
                    🏝️ Bohol, here we come! 💍
                </motion.p>
            </div>
        </div>
    )
}
