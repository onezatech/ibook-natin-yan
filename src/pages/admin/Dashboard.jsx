import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut } from 'firebase/auth'
import * as XLSX from 'xlsx'
import { auth } from '../../firebase/firebase'
import { getAllGroups, getIdDownloadUrl, updateTraveler, deleteTraveler, deleteGroup } from '../../firebase/service'

// ── Helpers ────────────────────────────────────────────────

function flattenTravelers(groups) {
    return groups.flatMap(g =>
        (g.travelers || []).map(t => ({ ...t, _group: g }))
    )
}

function formatDate(dob) {
    if (!dob) return '—'
    try {
        const d = new Date(dob)
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const y = d.getFullYear()
        return `${m}/${day}/${y}`
    } catch { return dob }
}

function formatSubmittedAt(ts) {
    if (!ts) return '—'
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts)
        return d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
    } catch { return '—' }
}

// ── Export functions ───────────────────────────────────────

const EXPORT_HEADERS = ['Full Name', 'Date of Birth', 'Passenger Type', 'Has Budget', 'ID Type', 'Submitted By', 'Submitter Mobile', 'Submitter Email', 'Submitted At']

function buildRows(groups) {
    return groups.flatMap(g =>
        (g.travelers || []).map(t => ({
            'Full Name': t.fullName || '',
            'Date of Birth': formatDate(t.dob),
            'Passenger Type': t.passengerType || '',
            'Has Budget': t.hasBudget ? 'Yes' : 'No',
            'ID Type': t.idType || '',
            'Submitted By': g.submitterName || '',
            'Submitter Mobile': g.submitterMobile || '',
            'Submitter Email': g.submitterEmail || '',
            'Submitted At': formatSubmittedAt(g.submittedAt),
        }))
    )
}

function exportCSV(groups) {
    const rows = buildRows(groups)
    const csv = [EXPORT_HEADERS.join(','), ...rows.map(r =>
        EXPORT_HEADERS.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(',')
    )].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `ibook-natin-yan-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
}

function exportExcel(groups) {
    const rows = buildRows(groups)
    const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_HEADERS })
    // Style header row width
    ws['!cols'] = EXPORT_HEADERS.map(() => ({ wch: 22 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Travelers')
    XLSX.writeFile(wb, `ibook-natin-yan-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// Google Sheets: export as CSV then open Google Sheets import URL
function exportForGoogleSheets(groups) {
    exportCSV(groups)
    setTimeout(() => {
        window.open('https://sheets.new', '_blank')
    }, 500)
}

// ── Sub-components ─────────────────────────────────────────

function StatCard({ label, value, emoji, border }) {
    return (
        <div className={`bg-white rounded-3xl p-5 shadow-sm border-b-4 ${border} flex items-center gap-4`}>
            <span className="text-4xl">{emoji}</span>
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
                <p className="text-slate-800 font-display text-4xl leading-none mt-1">{value}</p>
            </div>
        </div>
    )
}

function TravelerModal({ traveler, group, onClose, onReload }) {
    const [idUrl, setIdUrl] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (traveler) {
            setEditData({ ...traveler })
            if (traveler.idStoragePath) {
                getIdDownloadUrl(traveler.idStoragePath)
                    .then(setIdUrl).catch(() => setIdUrl(null))
            } else if (traveler.idImageUrl) {
                setIdUrl(traveler.idImageUrl) // legacy fallback
            }
        }
    }, [traveler])

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateTraveler(group.id, traveler.id, {
                fullName: editData.fullName,
                dob: editData.dob,
                placeOfBirth: editData.placeOfBirth,
                passengerType: editData.passengerType,
                hasBudget: editData.hasBudget,
            })
            onReload()
            onClose()
        } catch (e) {
            alert('Error updating: ' + e.message)
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${traveler.fullName}?`)) return
        setSaving(true)
        try {
            await deleteTraveler(group.id, traveler.id)
            onReload()
            onClose()
        } catch (e) {
            alert('Error deleting: ' + e.message)
        }
        setSaving(false)
    }

    if (!traveler) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
                onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">

                <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl">
                    <div className="min-w-0 pr-4">
                        <h3 className="font-display text-xl text-slate-800 truncate">{traveler.fullName}</h3>
                        <p className="text-slate-400 text-xs">{traveler.passengerType}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {!isEditing && <button onClick={() => setIsEditing(true)} className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 flex items-center justify-center text-sm" title="Edit">✏️</button>}
                        <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center">✕</button>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {isEditing ? (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Full Name</label>
                                <input className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800" value={editData.fullName} onChange={e => setEditData({ ...editData, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Date of Birth</label>
                                <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800" value={editData.dob} onChange={e => setEditData({ ...editData, dob: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Place of Birth</label>
                                <input className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800" value={editData.placeOfBirth} onChange={e => setEditData({ ...editData, placeOfBirth: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Passenger Type</label>
                                <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800" value={editData.passengerType} onChange={e => setEditData({ ...editData, passengerType: e.target.value })}>
                                    {['Adult', 'Senior (60+)', 'PWD', 'Student', 'Minor (3–12)', 'Infant (0–2)'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-1">
                                    <input type="checkbox" checked={editData.hasBudget} onChange={e => setEditData({ ...editData, hasBudget: e.target.checked })} />
                                    <span>Has Budget?</span>
                                </label>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={handleDelete} disabled={saving} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3 py-2 rounded-xl text-xs flex-1 transition-colors">🗑️ Delete</button>
                                <button onClick={() => { setIsEditing(false); setEditData({ ...traveler }) }} disabled={saving} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex-1 transition-colors">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-3 py-2 rounded-xl text-xs flex-1 transition-colors">{saving ? '...' : 'Save'}</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${traveler.hasBudget ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-600'}`}>
                                {traveler.hasBudget ? '💰 Has flight budget' : '🙏 No budget yet'}
                            </span>

                            <div className="space-y-3">
                                <Detail label="Date of Birth" value={formatDate(traveler.dob)} />
                                <Detail label="Place of Birth" value={traveler.placeOfBirth} />
                                <Detail label="Passenger Type" value={traveler.passengerType} />
                                <Detail label="ID Type" value={traveler.idType} />
                                {(traveler.idType === 'Others' || traveler.idCustom) && <Detail label="Custom ID" value={traveler.idCustom} />}
                            </div>
                        </>
                    )}

                    {idUrl && (
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">ID Photo</p>
                            <a href={idUrl} target="_blank" rel="noreferrer" className="block">
                                <img src={idUrl} alt="ID" className="w-full rounded-2xl border-2 border-slate-100 hover:border-teal-300 transition-colors shadow-sm" />
                            </a>
                            <p className="text-slate-400 text-xs mt-1 text-center">Click to view full size</p>
                        </div>
                    )}
                    {traveler.idStoragePath && !idUrl && (
                        <div className="text-center py-4 text-slate-400 text-sm">⏳ Loading ID photo…</div>
                    )}

                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                        <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-2">Submitted by</p>
                        <p className="text-slate-800 font-semibold">{group.submitterName}</p>
                        <p className="text-slate-500 text-sm">{group.submitterMobile}</p>
                        <p className="text-slate-500 text-sm">{group.submitterEmail}</p>
                        <p className="text-slate-400 text-xs mt-1">{formatSubmittedAt(group.submittedAt)}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function Detail({ label, value }) {
    return (
        <div className="flex justify-between items-start gap-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest shrink-0">{label}</span>
            <span className="text-slate-700 font-semibold text-sm text-right">{value || '—'}</span>
        </div>
    )
}

// ── Main Dashboard ─────────────────────────────────────────

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterBudget, setFilterBudget] = useState('all')
    const [selectedTraveler, setSelectedTraveler] = useState(null)
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [showExportMenu, setShowExportMenu] = useState(false)

    const loadGroups = () => {
        setLoading(true)
        getAllGroups()
            .then(setGroups)
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    useEffect(() => { loadGroups() }, [])

    const handleLogout = async () => {
        await signOut(auth)
        navigate('/admin/login')
    }

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm('Delete this entire submission (all family members)? This cannot be undone.')) return
        await deleteGroup(groupId)
        loadGroups()
    }

    const allTravelers = flattenTravelers(groups)

    const filtered = allTravelers.filter(t => {
        const q = search.toLowerCase()
        const matchSearch = !q ||
            t.fullName?.toLowerCase().includes(q) ||
            t._group.submitterName?.toLowerCase().includes(q) ||
            t.passengerType?.toLowerCase().includes(q) ||
            t.idType?.toLowerCase().includes(q)
        const matchBudget =
            filterBudget === 'all' ||
            (filterBudget === 'yes' && t.hasBudget) ||
            (filterBudget === 'no' && !t.hasBudget)
        return matchSearch && matchBudget
    })

    const stats = {
        total: allTravelers.length,
        groups: groups.length,
        hasBudget: allTravelers.filter(t => t.hasBudget).length,
        noBudget: allTravelers.filter(t => !t.hasBudget).length,
    }

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #E0F7FA 0%, #FFF9F0 60%, #FFF0F5 100%)' }}>

            {/* ── Topbar ── */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-teal-100 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center text-xl shadow-sm">🏝️</div>
                        <div>
                            <h1 className="font-display text-xl text-teal-700 leading-none">Bohol We Go</h1>
                            <p className="text-slate-400 text-xs">Wedding Admin · {stats.total} traveler{stats.total !== 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center flex-wrap">
                        {/* Export dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(v => !v)}
                                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-2xl text-sm transition-colors shadow-sm"
                            >
                                📥 Export <span className="text-teal-200 text-xs">▾</span>
                            </button>
                            <AnimatePresence>
                                {showExportMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-30 min-w-[180px]"
                                        onMouseLeave={() => setShowExportMenu(false)}
                                    >
                                        {[
                                            { label: '📊 Excel (.xlsx)', action: () => { exportExcel(groups); setShowExportMenu(false) } },
                                            { label: '📋 CSV File', action: () => { exportCSV(groups); setShowExportMenu(false) } },
                                            { label: '🟢 Google Sheets', action: () => { exportForGoogleSheets(groups); setShowExportMenu(false) } },
                                        ].map(item => (
                                            <button key={item.label} onClick={item.action}
                                                className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                                                {item.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button onClick={handleLogout}
                            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-2xl text-sm transition-colors">
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-24">
                        <div className="text-6xl animate-bounce mb-4">🌊</div>
                        <p className="text-slate-500 font-semibold">Loading submissions…</p>
                    </div>
                ) : (
                    <>
                        {/* ── Stat cards ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard label="Total Travelers" value={stats.total} emoji="👥" border="border-teal-400" />
                            <StatCard label="Family Groups" value={stats.groups} emoji="👨‍👩‍👧‍👦" border="border-amber-400" />
                            <StatCard label="Have Budget" value={stats.hasBudget} emoji="💰" border="border-green-400" />
                            <StatCard label="Need Help" value={stats.noBudget} emoji="🙏" border="border-coral" />
                        </div>

                        {/* ── Budget breakdown bar ── */}
                        {stats.total > 0 && (
                            <div className="bg-white rounded-3xl p-5 shadow-sm mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="font-bold text-slate-600 text-sm uppercase tracking-widest">Budget Overview</h2>
                                    <span className="text-slate-400 text-xs">{stats.total} total</span>
                                </div>
                                <div className="flex rounded-full overflow-hidden h-4">
                                    <div
                                        className="bg-teal-400 transition-all duration-500"
                                        style={{ width: `${(stats.hasBudget / stats.total) * 100}%` }}
                                    />
                                    <div
                                        className="bg-coral/70 transition-all duration-500"
                                        style={{ width: `${(stats.noBudget / stats.total) * 100}%` }}
                                    />
                                </div>
                                <div className="flex gap-4 mt-3 text-xs font-semibold text-slate-500">
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-400 inline-block" /> Have budget ({stats.hasBudget})</span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-coral/70 inline-block" /> No budget ({stats.noBudget})</span>
                                </div>
                            </div>
                        )}

                        {/* ── Search & filter ── */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                                <input
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                                    placeholder="Search by name, ID type, passenger type…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <select
                                value={filterBudget}
                                onChange={e => setFilterBudget(e.target.value)}
                                className="bg-white border border-slate-200 rounded-2xl py-3 px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm sm:w-48"
                            >
                                <option value="all">All budgets</option>
                                <option value="yes">💰 Has budget</option>
                                <option value="no">🙏 No budget</option>
                            </select>
                        </div>

                        {/* ── Grouped Submissions View ── */}
                        <div className="space-y-4">
                            {groups.length === 0 ? (
                                <div className="bg-white rounded-3xl p-12 text-center text-slate-400 shadow-sm border border-slate-100">
                                    <p className="text-5xl mb-3">🏖️</p>
                                    <p className="font-semibold">No submissions yet.</p>
                                    <p className="text-sm mt-1">Share the form link with your family!</p>
                                </div>
                            ) : (
                                groups
                                    .filter(g => {
                                        if (!search && filterBudget === 'all') return true
                                        return (g.travelers || []).some(t => {
                                            const q = search.toLowerCase()
                                            const matchSearch = !q || t.fullName?.toLowerCase().includes(q) || g.submitterName?.toLowerCase().includes(q) || t.passengerType?.toLowerCase().includes(q)
                                            const matchBudget = filterBudget === 'all' || (filterBudget === 'yes' && t.hasBudget) || (filterBudget === 'no' && !t.hasBudget)
                                            return matchSearch && matchBudget
                                        })
                                    })
                                    .map((g, gi) => {
                                        const filteredTravelers = (g.travelers || []).filter(t => {
                                            const q = search.toLowerCase()
                                            const matchSearch = !q || t.fullName?.toLowerCase().includes(q) || g.submitterName?.toLowerCase().includes(q) || t.passengerType?.toLowerCase().includes(q)
                                            const matchBudget = filterBudget === 'all' || (filterBudget === 'yes' && t.hasBudget) || (filterBudget === 'no' && !t.hasBudget)
                                            return matchSearch && matchBudget
                                        })
                                        return (
                                            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.05 }}
                                                className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

                                                {/* Group header */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-amber-400 rounded-2xl flex items-center justify-center text-amber-900 font-bold text-sm shrink-0">
                                                            {gi + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{g.submitterName}</p>
                                                            <p className="text-slate-500 text-xs">{g.submitterMobile} · {g.submitterEmail}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 pl-12 sm:pl-0">
                                                        <span className="text-xs bg-teal-100 text-teal-700 font-bold px-3 py-1 rounded-full shrink-0">
                                                            {g.travelers?.length || 0} traveler{(g.travelers?.length || 0) !== 1 ? 's' : ''}
                                                        </span>
                                                        <span className="text-slate-400 text-xs hidden sm:block shrink-0">{formatSubmittedAt(g.submittedAt)}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }} className="w-8 h-8 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center shrink-0 transition-colors text-sm" title="Delete Group">🗑️</button>
                                                    </div>
                                                </div>

                                                {/* Traveler rows with tree indicator */}
                                                <div className="divide-y divide-slate-50">
                                                    {filteredTravelers.map((t, ti) => {
                                                        const isLast = ti === filteredTravelers.length - 1
                                                        return (
                                                            <div key={t.id || ti}
                                                                onClick={() => { setSelectedTraveler(t); setSelectedGroup(g) }}
                                                                className="flex items-stretch hover:bg-teal-50/50 cursor-pointer transition-colors group">

                                                                {/* Tree indicator */}
                                                                <div className="w-12 flex flex-col items-center shrink-0 py-3">
                                                                    <div className={`w-0.5 bg-teal-200 ${ti === 0 ? 'mt-3 h-1/2' : 'h-1/2'}`} />
                                                                    <div className="w-2.5 h-0.5 bg-teal-200" />
                                                                    {!isLast && <div className="w-0.5 bg-teal-200 flex-1" />}
                                                                </div>

                                                                {/* Traveler info */}
                                                                <div className="flex-1 py-3 pr-4">
                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <p className="font-semibold text-slate-800 text-sm truncate">{t.fullName}</p>
                                                                            {ti === 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold shrink-0">Submitter</span>}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${t.hasBudget ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-600'}`}>
                                                                                {t.hasBudget ? '💰' : '🙏'}
                                                                            </span>
                                                                            <span className="text-slate-500 text-xs hidden sm:block group-hover:text-teal-600 transition-colors">View →</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-400">
                                                                        <span>{t.passengerType}</span>
                                                                        <span>·</span>
                                                                        <span>{formatDate(t.dob)}</span>
                                                                        {t.placeOfBirth && <><span>·</span><span>{t.placeOfBirth}</span></>}
                                                                        <span>·</span>
                                                                        <span>🪪 {t.idType}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                        )
                                    })
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ── Detail modal ── */}
            <AnimatePresence>
                {selectedTraveler && (
                    <TravelerModal
                        traveler={selectedTraveler}
                        group={selectedGroup}
                        onClose={() => { setSelectedTraveler(null); setSelectedGroup(null) }}
                        onReload={loadGroups}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
