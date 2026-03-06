import {
    collection, addDoc, getDocs, query, orderBy, serverTimestamp,
    doc, setDoc, collectionGroup, updateDoc, deleteDoc, where, getDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'

const GROUPS_COL = 'groups'
const TRAVELERS_COL = 'travelers'

/**
 * Check if a traveler full name already exists across ALL groups (case-insensitive).
 * Uses collectionGroup — requires Firestore rules to allow public read on travelers.
 * On permission error, allows submission (fail-open so UX isn't broken).
 */
export async function checkNameExists(fullName) {
    const normalized = fullName.trim().toLowerCase()
    try {
        const q = query(collectionGroup(db, TRAVELERS_COL))
        const snap = await getDocs(q)
        return snap.docs.some(d => d.data().fullName?.trim().toLowerCase() === normalized)
    } catch (err) {
        console.warn('checkNameExists: permission denied or network error, allowing submission.', err.message)
        return false // fail-open so user can still submit
    }
}

/**
 * Upload ID image to Firebase Storage.
 * Returns the STORAGE PATH (not a download URL).
 * Download URL is resolved later by the authenticated admin.
 */
export async function uploadIdImage(groupId, travelerId, file) {
    const path = `ids/${groupId}/${travelerId}`
    const storageRef = ref(storage, path)
    const metadata = { contentType: file.type }
    await uploadBytes(storageRef, file, metadata)
    return path  // return path, not download URL
}

/**
 * Resolve a storage path to a download URL.
 * Must be called when the user is authenticated (admin).
 */
export async function getIdDownloadUrl(storagePath) {
    return getDownloadURL(ref(storage, storagePath))
}

/**
 * Submit a full family group to Firestore
 * @param {Object} submitterInfo - { submitterName, submitterMobile, submitterEmail }
 * @param {Array}  travelers - array of traveler objects (with optional idFile for upload)
 */
export async function submitGroup(submitterInfo, travelers) {
    // Create the group doc first
    const groupRef = await addDoc(collection(db, GROUPS_COL), {
        ...submitterInfo,
        travelerCount: travelers.length,
        submittedAt: serverTimestamp(),
        status: 'pending',
    })

    const groupId = groupRef.id

    // Add each traveler as a subcollection doc
    for (const traveler of travelers) {
        const { idFile, _tempId, ...travelerData } = traveler
        const travelerId = _tempId || doc(collection(db, '_')).id

        let idStoragePath = null
        if (idFile) {
            idStoragePath = await uploadIdImage(groupId, travelerId, idFile)
        }

        await setDoc(doc(db, GROUPS_COL, groupId, TRAVELERS_COL, travelerId), {
            ...travelerData,
            idStoragePath,   // store path, admin resolves URL on demand
        })
    }

    return groupId
}

/**
 * Get all groups + their travelers (admin only — enforced by Firestore rules)
 */
export async function getAllGroups() {
    const groupsSnap = await getDocs(
        query(collection(db, GROUPS_COL), orderBy('submittedAt', 'desc'))
    )

    const groups = []
    for (const groupDoc of groupsSnap.docs) {
        const travelersSnap = await getDocs(
            collection(db, GROUPS_COL, groupDoc.id, TRAVELERS_COL)
        )
        groups.push({
            id: groupDoc.id,
            ...groupDoc.data(),
            travelers: travelersSnap.docs.map(t => ({ id: t.id, ...t.data() })),
        })
    }
    return groups
}

/**
 * Admin: Update a traveler's details
 */
export async function updateTraveler(groupId, travelerId, updates) {
    await updateDoc(doc(db, GROUPS_COL, groupId, TRAVELERS_COL, travelerId), updates)
}

/**
 * Admin: Delete a single traveler and decrement group count
 */
export async function deleteTraveler(groupId, travelerId) {
    await deleteDoc(doc(db, GROUPS_COL, groupId, TRAVELERS_COL, travelerId))
    const groupRef = doc(db, GROUPS_COL, groupId)
    const groupSnap = await getDoc(groupRef)
    if (groupSnap.exists()) {
        const current = groupSnap.data().travelerCount || 1
        await updateDoc(groupRef, { travelerCount: Math.max(0, current - 1) })
    }
}

/**
 * Admin: Delete an entire group (and all its travelers)
 */
export async function deleteGroup(groupId) {
    const tSnap = await getDocs(collection(db, GROUPS_COL, groupId, TRAVELERS_COL))
    await Promise.all(tSnap.docs.map(d => deleteDoc(d.ref)))
    await deleteDoc(doc(db, GROUPS_COL, groupId))
}
