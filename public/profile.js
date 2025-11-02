import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    updateEmail
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
    getFirestore,
    getDoc,
    doc,
    collection,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

import { firebaseConfig } from './firebaseConfig.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    localStorage.setItem("loggedInUserId", user.uid);

    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();

            const effectiveEmail = userData.email || user.email;
            const effectiveNickname = userData.nickname || "Not set";

            document.getElementById("profileNickname").innerText = effectiveNickname;
            document.getElementById("profileEmail").innerText = effectiveEmail;

            currentUser = user;
            currentProfile.nickname = userData.nickname || "";
            currentProfile.email = effectiveEmail;

            // Count saved books from subcollection users/{user.uid}/library
            try {
                const libRef = collection(db, `users/${user.uid}/library`);
                const libSnap = await getDocs(libRef);
                const numberOfBooks = libSnap.size || 0;
                document.getElementById("profileNrBooks").innerText = numberOfBooks;
            } catch (e) {
                console.warn("Could not load library count", e);
                document.getElementById("profileNrBooks").innerText = "-";
            }
        }
    } catch (error) {
        console.error("Error loading profile:", error);
        document.getElementById("profileNickname").innerText = "Error loading";
    }
});

// Logout
document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("loggedInUserId");
    signOut(auth)
        .then(() => window.location.href = "index.html")
        .catch((error) => console.error("Logout error:", error));
});

// Edit Profile Modal Logic
let currentUser = null;
let currentProfile = { nickname: "", email: "" };

const modal = document.getElementById("editModal");
const nickInput = document.getElementById("editNickname");
const emailInput = document.getElementById("editEmail");
const errDiv = document.getElementById("editError");
const saveBtn = document.getElementById("saveEdit");
const cancelBtn = document.getElementById("cancelEdit");

function openEditModal() {
    errDiv.textContent = "";
    nickInput.value = currentProfile.nickname || "";
    emailInput.value = currentProfile.email || "";
    modal.classList.remove("hidden");
}

function closeEditModal() {
    modal.classList.add("hidden");
}

document.getElementById("editProfile").addEventListener("click", openEditModal);
if (cancelBtn) cancelBtn.addEventListener("click", (e) => { e.preventDefault(); closeEditModal(); });
if (saveBtn) saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    errDiv.textContent = "";
    saveBtn.disabled = true;

    try {
        const newNickname = nickInput.value.trim();
        const newEmail = emailInput.value.trim();

        if (!newNickname) {
            throw new Error("Nickname can't be empty.");
        }

        // Uniqueness check for nickname (case-insensitive)
        if (newNickname.toLowerCase() !== (currentProfile.nickname || "").toLowerCase()) {
            const usersCol = collection(db, "users");
            const q = query(usersCol, where("nicknameLower", "==", newNickname.toLowerCase()));
            const qsnap = await getDocs(q);
            let taken = false;
            qsnap.forEach(d => { if (d.id !== currentUser.uid) taken = true; });
            if (taken) {
                throw new Error("Nickname is already taken. Choose another.");
            }
        }

        // Update Firestore profile fields first
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
            nickname: newNickname,
            nicknameLower: newNickname.toLowerCase(),
            email: newEmail || currentProfile.email
        }, { merge: true });

        // Try to update Auth email if changed (optional - may require recent login)
        let authEmailUpdated = false;
        if (newEmail && newEmail !== currentProfile.email) {
            try {
                await updateEmail(currentUser, newEmail);
                authEmailUpdated = true;
            } catch (emailErr) {
                console.warn("Auth email update failed (requires recent login):", emailErr);
                // Continue anyway - Firestore is updated
            }
        }

        // Reflect changes in UI and state
        document.getElementById("profileNickname").innerText = newNickname;
        document.getElementById("profileEmail").innerText = newEmail || currentProfile.email;
        currentProfile.nickname = newNickname;
        if (newEmail) currentProfile.email = newEmail;

        closeEditModal();
        
        // Show success message with auth email status
        if (newEmail && newEmail !== (currentProfile.email || "")) {
            if (!authEmailUpdated) {
                alert("Profile updated! Note: Auth email requires recent login. Please re-login to update your authentication email.");
            } else {
                alert("Profile updated successfully!");
            }
        }
    } catch (err) {
        console.error("Edit profile error:", err);
        if (err && err.code === "auth/requires-recent-login") {
            errDiv.textContent = "Email change requires recent sign-in. Please logout and login again.";
        } else {
            errDiv.textContent = err.message || "Failed to save changes.";
        }
    } finally {
        saveBtn.disabled = false;
    }
});