import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { checkNameExists, submitGroup } from '../firebase/service'

// ── Constants ──────────────────────────────────────────────
const MAX_TRAVELERS = 20

const PASSENGER_TYPES = ['Adult', 'Senior (60+)', 'PWD', 'Student', 'Minor (3–12)', 'Infant (0–2)']

const ID_BY_PASSENGER = {
    'Adult': ['Passport', 'Philippine National ID', "Driver's License", 'UMID / SSS / GSIS Card', 'PRC ID', 'Postal ID', 'Others'],
    'Senior (60+)': ['OSCA ID', 'Passport', 'Philippine National ID', "Driver's License", 'UMID / SSS / GSIS', 'Others'],
    'PWD': ['PWD ID', 'Passport', 'Philippine National ID', 'Others'],
    'Student': ['School ID', 'Enrollment Form', 'Passport', 'Others'],
    'Minor (3–12)': ['School ID', 'PSA Birth Certificate', 'Others'],
    'Infant (0–2)': ['PSA Birth Certificate', 'Baby Book', 'Others'],
}

const STEPS = ['Your Info', 'Add Travelers', 'Review & Submit']

function genId() { return Math.random().toString(36).slice(2, 10) }

// ── Beach palette ─────────────────────────────────────────────
const BG_STYLE = {
    background: 'linear-gradient(180deg, #87CEEB 0%, #4EB8D5 35%, #00BCD4 60%, #0097A7 75%, #F4C244 88%, #E8AC30 100%)'
}
const glassStyle = {
    background: 'rgba(255,255,255,0.30)',
    backdropFilter: 'blur(14px)',
    border: '1.5px solid rgba(255,255,255,0.55)',
    boxShadow: '0 12px 40px rgba(0,100,160,0.12)'
}

const glassCard = 'rounded-3xl'

function StepBar({ current }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                        style={i < current
                            ? { background: '#00BCD4', color: '#003D5B' }
                            : i === current
                                ? { background: '#F4C244', color: '#003D5B', transform: 'scale(1.1)', boxShadow: '0 4px 16px rgba(244,194,68,0.5)' }
                                : { background: 'rgba(255,255,255,0.25)', color: 'rgba(0,61,91,0.4)' }}>
                        {i < current ? '✓' : i + 1}
                    </div>
                    <span className="text-xs font-bold hidden sm:block" style={{ color: i === current ? '#003D5B' : 'rgba(0,61,91,0.45)' }}>{label}</span>
                    {i < STEPS.length - 1 && (
                        <div className="w-8 h-0.5 rounded" style={{ background: i < current ? '#00BCD4' : 'rgba(255,255,255,0.35)' }} />
                    )}
                </div>
            ))}
        </div>
    )
}


// ── Traveler Sub-form ──────────────────────────────────────
function TravelerForm({ onSave, onCancel, initialData, isFirst }) {
    const [step, setStep] = useState(1)
    const [data, setData] = useState(initialData || {
        fullName: '', dob: '', placeOfBirth: '', passengerType: 'Adult',
        hasBudget: null, idType: '', idCustom: '', idFile: null, idFileName: '',
    })
    // beach text colors
    const labelC = { color: '#004D63' }
    const headC = { color: '#003D5B' }
    const [errors, setErrors] = useState({})
    const [checking, setChecking] = useState(false)
    const fileRef = useRef()

    const set = (k, v) => setData(d => ({ ...d, [k]: v }))
    const err = (k, msg) => setErrors(e => ({ ...e, [k]: msg }))
    const clearErr = (k) => setErrors(e => { const n = { ...e }; delete n[k]; return n })

    const validateStep1 = async () => {
        let valid = true
        if (!data.fullName.trim()) { err('fullName', 'Full name is required'); valid = false }
        if (!data.dob) { err('dob', 'Date of birth is required'); valid = false }
        if (!data.placeOfBirth.trim()) { err('placeOfBirth', 'Place of birth is required'); valid = false }
        if (valid && !initialData) {
            setChecking(true)
            try {
                const exists = await checkNameExists(data.fullName)
                if (exists) {
                    err('fullName', `"${data.fullName}" is already registered! 🙌 Someone may have added them already.`)
                    valid = false
                }
            } catch { /* allow on network error */ }
            setChecking(false)
        }
        return valid
    }

    const validateStep2 = () => {
        let valid = true
        if (!data.passengerType) { err('passengerType', 'Please select type'); valid = false }
        if (data.hasBudget === null) { err('hasBudget', 'Please select a budget option'); valid = false }
        return valid
    }

    const validateStep3 = () => {
        let valid = true
        if (!data.idType) { err('idType', 'Please select an ID type'); valid = false }
        if (data.idType === 'Others' && !data.idCustom.trim()) { err('idCustom', 'Please specify the ID type'); valid = false }
        if (!data.idFile && !initialData?.idStoragePath) { err('idFile', 'Please upload a photo of the ID'); valid = false }
        return valid
    }

    const next = async () => {
        if (step === 1 && await validateStep1()) setStep(2)
        else if (step === 2 && validateStep2()) setStep(3)
        else if (step === 3 && validateStep3()) {
            const finalIdType = data.idType === 'Others' ? data.idCustom.trim() : data.idType
            onSave({ ...data, idType: finalIdType, _tempId: genId() })
        }
    }

    const idOptions = ID_BY_PASSENGER[data.passengerType] || ID_BY_PASSENGER['Adult']

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`${glassCard} p-5 mt-4`} style={glassStyle}>
            {isFirst && (
                <div className="rounded-2xl px-4 py-3 mb-4 flex gap-2 items-start" style={{ background: 'rgba(244,194,68,0.25)', border: '1px solid rgba(244,194,68,0.5)' }}>
                    <span className="text-lg shrink-0">👤</span>
                    <p className="text-sm font-semibold" style={{ color: '#004D63' }}>Add <span className="underline">your own details first</span>, then save and add family members.</p>
                </div>
            )}

            {/* Mini step bar */}
            <div className="flex gap-2 mb-5">
                {[1, 2, 3].map(s => (
                    <div key={s} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ background: step >= s ? '#F4C244' : 'rgba(255,255,255,0.3)' }} />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ── Step 1: Personal Info ── */}
                {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        <h3 className="font-display text-xl" style={headC}>Personal Info</h3>

                        <div>
                            <label className="block text-sm font-bold mb-2" style={labelC}>Full Name <span style={{ color: '#C0392B' }}>*</span></label>
                            <p className="text-xs mb-2" style={{ color: 'rgba(0,61,91,0.55)' }}>Exactly as it appears on the valid ID</p>
                            <input className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.70)', border: '1.5px solid rgba(0,188,212,0.4)', color: '#003D5B' }}
                                placeholder="e.g. Maria Santos Cruz"
                                value={data.fullName} onChange={e => { set('fullName', e.target.value); clearErr('fullName') }} />
                            {errors.fullName && <p className="text-xs mt-1 font-medium" style={{ color: '#C0392B' }}>{errors.fullName}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2" style={labelC}>Date of Birth <span style={{ color: '#C0392B' }}>*</span></label>
                                <input type="date" className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none"
                                    style={{ background: 'rgba(255,255,255,0.70)', border: '1.5px solid rgba(0,188,212,0.4)', color: '#003D5B' }}
                                    value={data.dob} max={new Date().toISOString().split('T')[0]}
                                    onChange={e => { set('dob', e.target.value); clearErr('dob') }} />
                                {errors.dob && <p className="text-xs mt-1 font-medium" style={{ color: '#C0392B' }}>{errors.dob}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2" style={labelC}>Place of Birth <span style={{ color: '#C0392B' }}>*</span></label>
                                <input className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none"
                                    style={{ background: 'rgba(255,255,255,0.70)', border: '1.5px solid rgba(0,188,212,0.4)', color: '#003D5B' }}
                                    placeholder="e.g. Cebu City"
                                    value={data.placeOfBirth} onChange={e => { set('placeOfBirth', e.target.value); clearErr('placeOfBirth') }} />
                                {errors.placeOfBirth && <p className="text-xs mt-1 font-medium" style={{ color: '#C0392B' }}>{errors.placeOfBirth}</p>}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Step 2: Passenger & Budget ── */}
                {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                        <h3 className="font-display text-xl" style={headC}>Travel Details</h3>

                        <div>
                            <label className="block text-sm font-bold mb-2" style={labelC}>Passenger Type <span style={{ color: '#C0392B' }}>*</span></label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {PASSENGER_TYPES.map(type => (
                                    <button key={type} type="button"
                                        onClick={() => { set('passengerType', type); set('idType', ''); clearErr('passengerType') }}
                                        style={data.passengerType === type
                                            ? { background: 'rgba(244,194,68,0.3)', border: '2px solid #F4C244', color: '#003D5B', boxShadow: '0 4px 12px rgba(244,194,68,0.3)', borderRadius: 16, padding: '10px 12px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
                                            : { background: 'rgba(255,255,255,0.35)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#004D63', borderRadius: 16, padding: '10px 12px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                        <span>{data.passengerType === type ? '🟠' : '⚪'}</span>
                                        <span>{type}</span>
                                    </button>
                                ))}
                            </div>
                            {errors.passengerType && <p className="form-error">{errors.passengerType}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2" style={labelC}>Flight Budget <span style={{ color: '#C0392B' }}>*</span></label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button type="button" onClick={() => { set('hasBudget', true); clearErr('hasBudget') }}
                                    style={data.hasBudget === true
                                        ? { background: 'rgba(0,188,212,0.2)', border: '2px solid #00BCD4', borderRadius: 16, padding: 16, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,188,212,0.25)' }
                                        : { background: 'rgba(255,255,255,0.35)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 16, padding: 16, cursor: 'pointer' }}>
                                    <span className="text-2xl">💰</span>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: '#003D5B' }}>I have a budget</p>
                                        <p className="text-xs" style={{ color: 'rgba(0,61,91,0.6)' }}>I can cover my flight ticket</p>
                                    </div>
                                </button>
                                <button type="button" onClick={() => { set('hasBudget', false); clearErr('hasBudget') }}
                                    style={data.hasBudget === false
                                        ? { background: 'rgba(244,194,68,0.2)', border: '2px solid #F4C244', borderRadius: 16, padding: 16, cursor: 'pointer', boxShadow: '0 4px 12px rgba(244,194,68,0.25)' }
                                        : { background: 'rgba(255,255,255,0.35)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 16, padding: 16, cursor: 'pointer' }}>
                                    <span className="text-2xl">🙏</span>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: '#003D5B' }}>No budget yet</p>
                                        <p className="text-xs" style={{ color: 'rgba(0,61,91,0.6)' }}>Need help with the ticket</p>
                                    </div>
                                </button>
                            </div>
                            {errors.hasBudget && <p className="form-error">{errors.hasBudget}</p>}
                        </div>
                    </motion.div>
                )}

                {/* ── Step 3: ID ── */}
                {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                        <h3 className="font-display text-xl" style={headC}>Valid ID</h3>

                        <div>
                            <label className="block text-sm font-bold mb-2" style={labelC}>ID Type <span style={{ color: '#C0392B' }}>*</span></label>
                            <p className="text-xs mb-2" style={{ color: 'rgba(0,61,91,0.55)' }}>Based on: <span style={{ color: '#004D63', fontWeight: 600 }}>{data.passengerType}</span></p>
                            <select
                                className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none cursor-pointer"
                                style={{ background: 'rgba(255,255,255,0.70)', border: '1.5px solid rgba(0,188,212,0.4)', color: '#003D5B' }}
                                value={data.idType}
                                onChange={e => { set('idType', e.target.value); set('idCustom', ''); clearErr('idType') }}
                            >
                                <option value="" style={{ color: '#003D5B', backgroundColor: '#E0F7FA' }}>Select ID type…</option>
                                {idOptions.map(id => (
                                    <option key={id} value={id} style={{ color: '#003D5B', backgroundColor: '#E0F7FA' }}>{id}</option>
                                ))}
                            </select>
                            {errors.idType && <p className="text-xs mt-1 font-medium" style={{ color: '#C0392B' }}>{errors.idType}</p>}
                        </div>

                        {/* Others — type your own ID */}
                        {data.idType === 'Others' && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                                <label className="block text-sm font-bold mb-2" style={labelC}>Specify ID <span style={{ color: '#C0392B' }}>*</span></label>
                                <input className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none"
                                    style={{ background: 'rgba(255,255,255,0.70)', border: '1.5px solid rgba(0,188,212,0.4)', color: '#003D5B' }}
                                    placeholder="e.g. COMELEC Voter's ID, Barangay ID…"
                                    value={data.idCustom} onChange={e => { set('idCustom', e.target.value); clearErr('idCustom') }} />
                                {errors.idCustom && <p className="text-xs mt-1 font-medium" style={{ color: '#C0392B' }}>{errors.idCustom}</p>}
                            </motion.div>
                        )}

                        <div>
                            <label className="block text-sm font-bold mb-2" style={labelC}>Upload ID Photo <span style={{ color: '#C0392B' }}>*</span></label>
                            <p className="text-xs mb-2" style={{ color: 'rgba(0,61,91,0.55)' }}>Clear photo or scan · max 5MB (JPG, PNG, PDF)</p>
                            <div onClick={() => fileRef.current?.click()}
                                style={data.idFile
                                    ? { border: '2px dashed #00BCD4', background: 'rgba(0,188,212,0.1)', borderRadius: 16, padding: 24, textAlign: 'center', cursor: 'pointer' }
                                    : { border: '2px dashed rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: 24, textAlign: 'center', cursor: 'pointer' }}>
                                {data.idFile ? (
                                    <div>
                                        <p className="text-emerald-300 font-semibold text-sm">📎 {data.idFileName}</p>
                                        <p className="text-white/40 text-xs mt-1">Click to change</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-3xl mb-2">📷</p>
                                        <p className="text-sm font-medium" style={{ color: '#004D63' }}>Click to upload photo</p>
                                        <p className="text-xs mt-1" style={{ color: 'rgba(0,61,91,0.45)' }}>or drag and drop here</p>
                                    </div>
                                )}
                            </div>
                            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                                onChange={e => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                        if (file.size > 5 * 1024 * 1024) { err('idFile', 'File must be under 5MB'); return }
                                        set('idFile', file); set('idFileName', file.name); clearErr('idFile')
                                    }
                                }} />
                            {errors.idFile && <p className="text-xs mt-1 font-medium" style={{ color: '#C0392B' }}>{errors.idFile}</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Nav */}
            <div className="flex gap-3 mt-6">
                <button type="button" onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}
                    style={{ background: 'rgba(255,255,255,0.35)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#004D63', fontWeight: 700, borderRadius: 16, padding: '12px 24px', flex: 1, cursor: 'pointer', fontSize: 14, transition: 'all .2s' }}>
                    {step === 1 ? 'Cancel' : '← Back'}
                </button>
                <button type="button" onClick={next} disabled={checking}
                    style={{ background: 'linear-gradient(135deg, #F4C244, #E8AC30)', color: '#003D5B', fontWeight: 700, borderRadius: 16, padding: '12px 24px', flex: 1, border: 'none', cursor: 'pointer', fontSize: 14, boxShadow: '0 6px 18px rgba(244,194,68,0.4)', opacity: checking ? 0.6 : 1 }}>
                    {checking ? '⏳ Checking…' : step === 3 ? 'Save ✓' : 'Next →'}
                </button>
            </div>
        </motion.div>
    )
}

// ── Main GroupForm ─────────────────────────────────────────
export default function GroupForm() {
    const navigate = useNavigate()
    const [phase, setPhase] = useState(1)
    const [submitter, setSubmitter] = useState({ submitterName: '', submitterEmail: '' })
    const [submitterErrors, setSubmitterErrors] = useState({})
    const [travelers, setTravelers] = useState([])
    const [addingTraveler, setAddingTraveler] = useState(false)
    const [editingIdx, setEditingIdx] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const setS = (k, v) => setSubmitter(s => ({ ...s, [k]: v }))
    const sErr = (k, msg) => setSubmitterErrors(e => ({ ...e, [k]: msg }))
    const clearSErr = (k) => setSubmitterErrors(e => { const n = { ...e }; delete n[k]; return n })

    const validateSubmitter = () => {
        let valid = true
        if (!submitter.submitterName.trim()) { sErr('submitterName', 'Your name is required'); valid = false }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitter.submitterEmail)) { sErr('submitterEmail', 'Enter a valid email address'); valid = false }
        return valid
    }

    const saveTraveler = (travelerData) => {
        if (editingIdx !== null) {
            setTravelers(t => t.map((x, i) => i === editingIdx ? travelerData : x))
            setEditingIdx(null)
        } else {
            setTravelers(t => [...t, travelerData])
        }
        setAddingTraveler(false)
    }

    const handleFinalSubmit = async () => {
        if (travelers.length === 0) return
        setSubmitting(true)
        setSubmitError('')
        try {
            await submitGroup(submitter, travelers)
            navigate('/success', { state: { count: travelers.length, submitterName: submitter.submitterName } })
        } catch (e) {
            setSubmitError('Something went wrong. Please try again. (' + e.message + ')')
        }
        setSubmitting(false)
    }

    return (
        <div className="min-h-screen px-4 py-10" style={BG_STYLE}>
            {/* Decorative beach blobs */}
            <div className="fixed top-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,255,255,0.20)' }} />
            <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(244,194,68,0.15)' }} />

            <div className="relative z-10 max-w-xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-4xl mb-2">🌴</p>
                    <h1 className="font-display text-3xl sm:text-4xl" style={{ color: '#003D5B', textShadow: '0 2px 12px rgba(0,100,160,0.2)' }}>Family Booking Info</h1>
                    <p className="text-sm mt-1 font-semibold" style={{ color: 'rgba(0,61,91,0.6)' }}>Ashley & Arlon's Wedding · Bohol 2026</p>
                </div>

                <StepBar current={phase - 1} />

                <AnimatePresence mode="wait">
                    {/* ── Phase 1: Submitter ── */}
                    {phase === 1 && (
                        <motion.div key="p1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <div className={`${glassCard} p-6 space-y-5`} style={glassStyle}>
                                <div>
                                    <h2 className="font-display text-2xl mb-1" style={{ color: '#003D5B' }}>Who's filling this out?</h2>
                                    <p className="text-sm" style={{ color: 'rgba(0,61,91,0.6)' }}>You'll add travelers (including yourself!) in the next step.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-2" style={{ color: '#004D63' }}>Your Name <span style={{ color: '#C0392B' }}>*</span></label>
                                    <input className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none"
                                        style={{ background: 'rgba(255,255,255,0.70)', border: '1.5px solid rgba(0,188,212,0.4)', color: '#003D5B' }}
                                        placeholder="e.g. Pedro Cruz" value={submitter.submitterName}
                                        onChange={e => { setS('submitterName', e.target.value); clearSErr('submitterName') }} />
                                    {submitterErrors.submitterName && <p className="text-xs mt-1 font-medium" style={{ color: '#C0392B' }}>{submitterErrors.submitterName}</p>}
                                </div>



                                <div>
                                    <label className="block text-sm font-bold mb-2" style={{ color: '#004D63' }}>Email Address <span style={{ color: '#C0392B' }}>*</span></label>
                                    <input type="email" className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none"
                                        style={{ background: 'rgba(255,255,255,0.70)', border: '1.5px solid rgba(0,188,212,0.4)', color: '#003D5B' }}
                                        placeholder="you@example.com" value={submitter.submitterEmail}
                                        onChange={e => { setS('submitterEmail', e.target.value); clearSErr('submitterEmail') }} />
                                    {submitterErrors.submitterEmail && <p className="text-xs mt-1 font-medium" style={{ color: '#C0392B' }}>{submitterErrors.submitterEmail}</p>}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => navigate('/')}
                                        style={{ background: 'rgba(255,255,255,0.35)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#004D63', fontWeight: 700, borderRadius: 16, padding: '14px 24px', flex: '0 0 auto', cursor: 'pointer', fontSize: 16, transition: 'all .2s' }}>
                                        ← Cancel
                                    </button>
                                    <button onClick={() => { if (validateSubmitter()) setPhase(2) }}
                                        style={{ flex: 1, background: 'linear-gradient(135deg, #F4C244, #E8AC30)', color: '#003D5B', fontWeight: 700, padding: '14px 24px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 16, cursor: 'pointer', fontSize: 16, boxShadow: '0 8px 24px rgba(244,194,68,0.45)', transition: 'all .2s' }}>
                                        Next — Add Travelers 🌴
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    )}

                    {/* ── Phase 2: Add Travelers ── */}
                    {phase === 2 && (
                        <motion.div key="p2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            {travelers.length === 0 && !addingTraveler && (
                                <div className={`${glassCard} p-6 text-center mb-4`} style={glassStyle}>
                                    <p className="text-4xl mb-3">👤</p>
                                    <p className="font-bold text-lg mb-1" style={{ color: '#003D5B' }}>Start with your own details!</p>
                                    <p className="text-sm font-semibold mt-1" style={{ color: '#004D63' }}>Add yourself first, then add family members one by one.</p>
                                </div>
                            )}

                            <div className="space-y-3 mb-4">
                                {travelers.map((t, i) => (
                                    <motion.div key={t._tempId || i} layout
                                        style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                                                ${i === 0 ? 'bg-amber-400 text-amber-900' : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'}`}>
                                                {i === 0 ? '👤' : i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-bold text-sm truncate" style={{ color: '#003D5B' }}>{t.fullName}</p>
                                                    {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: '#F4C244', color: '#003D5B' }}>You</span>}
                                                </div>
                                                <p className="text-xs" style={{ color: 'rgba(0,61,91,0.55)' }}>{t.passengerType} · {t.hasBudget ? '💰' : '🙏'} {t.hasBudget ? 'Has budget' : 'No budget'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button onClick={() => { setEditingIdx(i); setAddingTraveler(true) }}
                                                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-ocean/30 text-ocean hover:text-white flex items-center justify-center transition-colors text-sm">✏️</button>
                                            <button onClick={() => setTravelers(t => t.filter((_, j) => j !== i))}
                                                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-red-500/30 text-red-400 hover:text-white flex items-center justify-center transition-colors text-sm">🗑️</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {addingTraveler ? (
                                <TravelerForm
                                    onSave={saveTraveler}
                                    onCancel={() => { setAddingTraveler(false); setEditingIdx(null) }}
                                    initialData={editingIdx !== null ? travelers[editingIdx] : null}
                                    isFirst={travelers.length === 0}
                                />
                            ) : (
                                <div className="space-y-3">
                                    {travelers.length < MAX_TRAVELERS && (
                                        <button onClick={() => { setAddingTraveler(true); setEditingIdx(null) }}
                                            style={{ width: '100%', border: '2px dashed #0097A7', borderRadius: 16, padding: '14px', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#004D63', background: 'rgba(255,255,255,0.75)', transition: 'all .2s' }}>
                                            + {travelers.length === 0 ? '👤 Add My Details First' : '+ Add Another Family Member'}
                                        </button>
                                    )}

                                    {travelers.length > 0 && (
                                        <div className="flex gap-3 pt-1">
                                            <button onClick={() => setPhase(1)}
                                                style={{ flex: 1, background: 'rgba(255,255,255,0.35)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#004D63', fontWeight: 700, borderRadius: 16, padding: '12px', cursor: 'pointer', fontSize: 14 }}>
                                                ← Back
                                            </button>
                                            <button onClick={() => setPhase(3)}
                                                style={{ flex: 1, background: 'linear-gradient(135deg, #00BCD4, #0097A7)', color: '#fff', fontWeight: 700, borderRadius: 16, padding: '12px', border: 'none', cursor: 'pointer', fontSize: 14, boxShadow: '0 6px 18px rgba(0,188,212,0.35)' }}>
                                                Review ({travelers.length}) →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Phase 3: Review ── */}
                    {phase === 3 && (
                        <motion.div key="p3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <div className={`${glassCard} p-6 mb-4`} style={glassStyle}>
                                <h2 className="font-display text-2xl mb-4" style={{ color: '#003D5B' }}>Review Your Submission</h2>

                                <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.75)' }}>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(0,61,91,0.6)' }}>Submitted by</p>
                                    <p className="font-bold" style={{ color: '#003D5B' }}>{submitter.submitterName}</p>
                                    <p className="text-sm" style={{ color: 'rgba(0,61,91,0.7)' }}>{submitter.submitterEmail}</p>
                                </div>

                                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(0,61,91,0.5)' }}>Travelers ({travelers.length})</p>
                                <div className="space-y-3">
                                    {travelers.map((t, i) => (
                                        <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.75)' }}>
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold" style={{ color: '#003D5B' }}>{t.fullName}</p>
                                                        {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#F4C244', color: '#003D5B' }}>You</span>}
                                                    </div>
                                                    <p className="text-xs" style={{ color: 'rgba(0,61,91,0.65)' }}>{new Date(t.dob).toLocaleDateString('en-PH', { dateStyle: 'medium' })} · {t.placeOfBirth}</p>
                                                </div>
                                                <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-bold`} style={t.hasBudget ? { background: '#00BCD4', color: '#003D5B' } : { background: '#FF6B6B', color: '#fff' }}>
                                                    {t.hasBudget ? '💰' : '🙏'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: '#004D63', fontWeight: 600 }}>
                                                <span>🎫 {t.passengerType}</span>
                                                <span>🪪 {t.idType === 'Others' ? t.idCustom : t.idType}</span>
                                                {t.idFileName && <span className="truncate max-w-[120px]">📎 {t.idFileName}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {submitError && (
                                <div className="bg-red-500/20 border border-red-400/40 rounded-2xl p-4 mb-4 text-red-300 text-sm">
                                    {submitError}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setPhase(2)} disabled={submitting}
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.35)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#004D63', fontWeight: 700, borderRadius: 16, padding: '12px 24px', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                                    ← Edit
                                </button>
                                <button onClick={handleFinalSubmit} disabled={submitting}
                                    style={{ flex: 1, background: 'linear-gradient(135deg, #F4C244, #E8AC30)', color: '#003D5B', fontWeight: 700, borderRadius: 16, padding: '12px 24px', border: '2px solid rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, boxShadow: '0 8px 24px rgba(244,194,68,0.45)', opacity: submitting ? 0.6 : 1 }}>
                                    {submitting ? '⏳ Submitting…' : '🎉 Submit!'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
