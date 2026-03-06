import { useEffect, useState } from 'react'

const PETALS = ['🌺', '🌸', '🌼', '🌴', '🦜', '🐚']

function Petal({ emoji, style }) {
    return (
        <div className="petal" style={style}>
            {emoji}
        </div>
    )
}

export default function FloatingPetals() {
    const [petals, setPetals] = useState([])

    useEffect(() => {
        const count = 12
        const items = Array.from({ length: count }, (_, i) => ({
            id: i,
            emoji: PETALS[i % PETALS.length],
            style: {
                left: `${Math.random() * 100}%`,
                animationDuration: `${8 + Math.random() * 12}s`,
                animationDelay: `${Math.random() * 10}s`,
                fontSize: `${1 + Math.random() * 1.2}rem`,
                opacity: 0.4 + Math.random() * 0.3,
            },
        }))
        setPetals(items)
    }, [])

    return (
        <>
            {petals.map(p => (
                <Petal key={p.id} emoji={p.emoji} style={p.style} />
            ))}
        </>
    )
}
