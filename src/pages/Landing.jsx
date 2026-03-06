import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

// ── Beach palette (from image) ─────────────────────────────
// Sky: #87CEEB → #4EB8D5
// Ocean: #00BCD4 → #0097A7
// Sand: #F4C244 → #E8AC30
// Palms: #4CAF50
// Mountains: #5B7FA6

const BG = 'linear-gradient(180deg, #87CEEB 0%, #4EB8D5 35%, #00BCD4 60%, #0097A7 75%, #F4C244 88%, #E8AC30 100%)'

function CountdownUnit({ val, label }) {
    return (
        <div className="flex flex-col items-center min-w-[60px]"
            style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.4)' }}>
            <span className="font-display text-3xl" style={{ color: '#0D3B5E', lineHeight: 1 }}>{String(val).padStart(2, '0')}</span>
            <span className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: '#0D5C7A' }}>{label}</span>
        </div>
    )
}

function Countdown() {
    const WEDDING_DATE = new Date('2026-12-22T10:00:00')
    const [timeLeft, setTimeLeft] = useState({})

    useEffect(() => {
        const calc = () => {
            const diff = WEDDING_DATE - new Date()
            if (diff <= 0) return setTimeLeft({ expired: true })
            setTimeLeft({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff / 3600000) % 24),
                minutes: Math.floor((diff / 60000) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            })
        }
        calc()
        const id = setInterval(calc, 1000)
        return () => clearInterval(id)
    }, [])

    if (timeLeft.expired) return <p style={{ color: '#0D3B5E' }}>The wedding day is here! 🎉</p>
    if (!timeLeft.days && timeLeft.days !== 0) return null

    return (
        <div className="flex gap-3 justify-center flex-wrap">
            {[{ label: 'Days', val: timeLeft.days }, { label: 'Hours', val: timeLeft.hours },
            { label: 'Mins', val: timeLeft.minutes }, { label: 'Secs', val: timeLeft.seconds }]
                .map(({ label, val }) => <CountdownUnit key={label} label={label} val={val} />)}
        </div>
    )
}

export default function Landing() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: BG }}>

            {/* Decorative clouds / light blobs */}
            <div className="absolute top-8 left-1/4 w-64 h-20 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.35)', filter: 'blur(20px)' }} />
            <div className="absolute top-16 right-1/5 w-48 h-16 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.30)', filter: 'blur(18px)' }} />
            {/* Wave shimmer on water */}
            <div className="absolute pointer-events-none" style={{ top: '62%', left: 0, right: 0, height: 60, background: 'rgba(255,255,255,0.12)', filter: 'blur(8px)' }} />

            {/* Floating palm emojis */}
            <div className="absolute pointer-events-none select-none text-5xl" style={{ top: '8%', right: '5%', opacity: 0.7 }}>🌴</div>
            <div className="absolute pointer-events-none select-none text-4xl" style={{ top: '12%', left: '4%', opacity: 0.6 }}>⛅</div>
            <div className="absolute pointer-events-none select-none text-3xl" style={{ bottom: '10%', left: '6%', opacity: 0.5 }}>🌿</div>
            <div className="absolute pointer-events-none select-none text-3xl" style={{ bottom: '8%', right: '8%', opacity: 0.5 }}>🦀</div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16 text-center">

                {/* Emoji header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="text-5xl mb-4 select-none">
                    🌺 💍 🌴
                </motion.div>

                {/* Title */}
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                    className="font-display text-5xl sm:text-7xl mb-2"
                    style={{ color: '#FFFFFF', textShadow: '0 2px 16px rgba(0,80,130,0.35)' }}>
                    Kamusta?
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-lg sm:text-xl mb-2 font-bold"
                    style={{ color: '#E0F7FA', textShadow: '0 1px 6px rgba(0,60,100,0.3)' }}>
                    Sasama ka ba sa Bohol?
                </motion.p>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-lg sm:text-xl mb-2 font-bold"
                    style={{ color: '#E0F7FA', textShadow: '0 1px 6px rgba(0,60,100,0.3)' }}>
                    Planuhin natin yan 😁
                </motion.p>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-lg sm:text-xl mb-2 font-bold"
                    style={{ color: '#E0F7FA', textShadow: '0 1px 6px rgba(0,60,100,0.3)' }}>
                    Para to sa kasal nila 👇
                </motion.p>

                {/* Couple names card */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3 }}
                    className="mb-8">
                    <div style={{
                        background: 'rgba(255,255,255,0.30)', backdropFilter: 'blur(12px)',
                        borderRadius: 24, padding: '16px 32px', border: '2px solid rgba(255,255,255,0.55)',
                        boxShadow: '0 8px 32px rgba(0,100,160,0.15)'
                    }}>
                        <p className="font-display text-2xl sm:text-3xl" style={{ color: '#0D3B5E' }}>
                            <span style={{ color: '#E84393' }}>Ashley</span>
                            <span style={{ color: '#0097A7', margin: '0 12px', fontSize: '1.2rem' }}>🤍</span>
                            <span style={{ color: '#0097A7' }}>Arlon</span>
                        </p>

                    </div>
                </motion.div>



                {/* Info card */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
                    className="max-w-lg w-full mb-8 text-left" style={{
                        background: '#ffffff', backdropFilter: 'blur(14px)',
                        borderRadius: 28, padding: '28px 32px',
                        border: '1.5px solid rgba(255,255,255,0.5)',
                        boxShadow: '0 12px 40px rgba(0,100,160,0.12)'
                    }}>
                    <h2 className="font-display text-2xl mb-3 text-center" style={{ color: '#003D5B' }}>Hey ka Pamilya! 👋</h2>
                    <p className="text-base leading-relaxed text-center" style={{ color: '#005F73' }}>
                        Para sa booking ng flight ng lahat, kailangan lang namin ng konting detalye.Pwedeng kanya kanya mag submit ng details, Pwede din isang tao na lang ang mag-fill out para sa buong pamilya — wag niyo na abalahin ang mga tanders na sumagot pa nito!
                    </p>
                    <ul className="mt-5 space-y-2">
                        {[
                            '✅ Ilagay ang Full name at Date of Birth.',
                            '✅ Upload ang pangmalakasang valid ID.',
                            '✅ Idagdag ang iba pang myembro ng pamilya.',
                        ].map(item => (
                            <li key={item} className="text-sm font-semibold flex gap-2" style={{ color: '#004D63' }}>{item}</li>
                        ))}
                    </ul>
                </motion.div>

                {/* CTA button */}
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.7 }}>
                    <button onClick={() => navigate('/form')}
                        className="text-lg px-10 py-4 font-bold transition-all duration-200 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #F4C244, #E8AC30)',
                            color: '#003D5B',
                            borderRadius: 20,
                            border: '2px solid rgba(255,255,255,0.5)',
                            boxShadow: '0 8px 24px rgba(228,172,48,0.45)',
                            cursor: 'pointer',
                        }}>
                        🏝️ Mag Submit
                    </button>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                    className="text-xs mt-6 font-medium" style={{ color: 'rgba(0,80,120,0.6)' }}>
                    Questions? Message the family coordinator 💬
                </motion.p>
            </div>

            {/* Sandy wave at bottom */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: 60 }}>
                <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    <path d="M0,30 C300,60 900,0 1200,30 L1200,60 L0,60 Z" fill="rgba(255,255,255,0.15)" />
                    <path d="M0,40 C400,10 800,60 1200,40 L1200,60 L0,60 Z" fill="rgba(255,255,255,0.10)" />
                </svg>
            </div>
        </div>
    )
}
