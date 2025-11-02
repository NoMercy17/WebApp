import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

import { firebaseConfig } from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const messageDiv = document.getElementById("message");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const friendsList = document.getElementById("friendsList");
const requestsList = document.getElementById("requestsList");
const searchResults = document.getElementById("searchResults");

function showMessage(text, type = "info") {
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = text ? "block" : "none";
}

// Tab switching
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        
        tab.classList.add("active");
        const targetTab = tab.getAttribute("data-tab");
        document.getElementById(`tab-${targetTab}`).classList.add("active");
        
        showMessage("", "info");
        
        if (targetTab === "my-friends") {
            loadMyFriends();
        } else if (targetTab === "requests") {
            loadFriendRequests();
        } else if (targetTab === "search") {
            loadAllUsers();
        }
    });
});

async function loadMyFriends() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        friendsList.innerHTML = "<p>Loading...</p>";
        const q = query(
            collection(db, `users/${user.uid}/friends`),
            where("status", "==", "accepted")
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            friendsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-friends"></i>
                    <h2>No friends yet</h2>
                    <p>Search for users and send friend requests to start building your network!</p>
                </div>
            `;
            return;
        }
        
        friendsList.innerHTML = "";
        for (const docSnap of snapshot.docs) {
            const friendData = docSnap.data();
            const friendUid = friendData.friendUid;
            
            const friendDocRef = doc(db, "users", friendUid);
            const friendDoc = await getDoc(friendDocRef);
            
            if (friendDoc.exists()) {
                const profile = friendDoc.data();
                const item = createFriendItem(profile, friendUid, "friend", "friends");
                friendsList.appendChild(item);
            }
        }
    } catch (error) {
        console.error("Error loading friends:", error);
        const code = error && (error.code || error.message || "");
        friendsList.innerHTML = `<p>Failed to load friends. ${code.includes('permission') ? 'Hint: Deploy Firestore rules.' : ''}</p>`;
    }
}

async function loadFriendRequests() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        requestsList.innerHTML = "<p>Loading...</p>";
        const q = query(
            collection(db, `users/${user.uid}/friends`),
            where("status", "==", "pending"),
            where("requester", "==", false)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            requestsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-envelope-open"></i>
                    <h2>No pending requests</h2>
                    <p>You have no friend requests at the moment.</p>
                </div>
            `;
            return;
        }
        
        requestsList.innerHTML = "";
        for (const docSnap of snapshot.docs) {
            const requestData = docSnap.data();
            const requesterUid = requestData.friendUid;
            
            const requesterDocRef = doc(db, "users", requesterUid);
            const requesterDoc = await getDoc(requesterDocRef);
            
            if (requesterDoc.exists()) {
                const profile = requesterDoc.data();
                const item = createFriendItem(profile, requesterUid, "request", "requests");
                requestsList.appendChild(item);
            }
        }
    } catch (error) {
        console.error("Error loading requests:", error);
        const code = error && (error.code || error.message || "");
        requestsList.innerHTML = `<p>Failed to load requests. ${code.includes('permission') ? 'Hint: Deploy Firestore rules.' : ''}</p>`;
    }
}

async function searchUsers() {
    const user = auth.currentUser;
    if (!user) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    try {
        showMessage(searchTerm ? "Searching..." : "Loading users...", "info");
        
        let q;
        if (searchTerm) {
            q = query(
                collection(db, "users"),
                where("nicknameLower", ">=", searchTerm),
                where("nicknameLower", "<=", searchTerm + '\uf8ff')
            );
        } else {
            q = collection(db, "users");
        }
        
        const snapshot = await getDocs(q);
        
        searchResults.innerHTML = "";
        
        if (snapshot.empty) {
            searchResults.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h2>No users found</h2>
                    <p>Try a different nickname.</p>
                </div>
            `;
            showMessage(`No users found for "${searchTerm}"`, "info");
            return;
        }
        
        let resultsCount = 0;
        for (const docSnap of snapshot.docs) {
            if (docSnap.id === user.uid) continue;
            
            const profile = docSnap.data();
            const targetUid = docSnap.id;
            
            const friendshipStatus = await checkFriendshipStatus(user.uid, targetUid);
            const item = createFriendItem(profile, targetUid, friendshipStatus, "search");
            searchResults.appendChild(item);
            resultsCount++;
        }
        
        if (resultsCount === 0) {
            searchResults.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h2>No other users</h2>
                    <p>${searchTerm ? "Try a different nickname." : "You're the only registered user."}</p>
                </div>
            `;
            showMessage(searchTerm ? "No users found." : "No other users registered.", "info");
        } else {
            const msg = searchTerm ? 
                `Found ${resultsCount} user${resultsCount !== 1 ? 's' : ''}` :
                `Showing ${resultsCount} user${resultsCount !== 1 ? 's' : ''}`;
            showMessage(msg, "success");
        }
    } catch (error) {
        console.error("Search error:", error);
        showMessage("Search failed.", "error");
    }
}

async function loadAllUsers() {
    searchInput.value = "";
    await searchUsers();
}

async function checkFriendshipStatus(myUid, targetUid) {
    try {
        const friendDocRef = doc(db, `users/${myUid}/friends/${targetUid}`);
        const friendDoc = await getDoc(friendDocRef);
        
        if (!friendDoc.exists()) {
            console.log(`  📄 No friend doc: ${targetUid} → status: none`);
            return "none";
        }
        
        const data = friendDoc.data();
        if (data.status === "accepted") {
            console.log(`  📄 Friend doc exists: ${targetUid} → status: friend (accepted)`);
            return "friend";
        } else if (data.status === "pending") {
            const result = data.requester ? "pending-sent" : "pending-received";
            console.log(`  📄 Friend doc exists: ${targetUid} → status: ${result} (requester: ${data.requester})`);
            return result;
        }
        console.log(`  📄 Friend doc exists: ${targetUid} → unknown status, returning: none`);
        return "none";
    } catch (error) {
        console.error("Error checking friendship:", error);
        return "none";
    }
}

function createFriendItem(profile, uid, status, context = "search") {
    console.log("🔍 createFriendItem called:", { uid, status, context, nickname: profile.nickname });
    const item = document.createElement("div");
    item.className = "friend-item";
    
    const avatar = document.createElement("div");
    avatar.className = "friend-avatar";
    avatar.textContent = (profile.nickname || profile.email || "?")[0].toUpperCase();
    
    const info = document.createElement("div");
    info.className = "friend-info";
    
    const nickname = document.createElement("div");
    nickname.className = "friend-nickname";
    nickname.textContent = profile.nickname || "Unknown";
    
    const email = document.createElement("div");
    email.className = "friend-email";
    email.textContent = profile.email || "";
    
    info.appendChild(nickname);
    info.appendChild(email);
    
    const actions = document.createElement("div");
    actions.className = "friend-actions";
    
    if (context === "search") {
        // Search Users: single 3-mode button
        const button = document.createElement("button");
        button.className = "btn";
        
        if (status === "friend") {
            console.log("  ➡️ Button mode: FRIENDS (disabled)");
            button.classList.add("btn-secondary");
            button.textContent = "Friends";
            button.disabled = true;
        } else if (status === "pending-sent") {
            console.log("  ➡️ Button mode: REQUEST SENT (can cancel)");
            button.classList.add("btn-secondary");
            button.textContent = "Request Sent";
            button.title = "Click to cancel request";
            button.addEventListener("click", () => cancelSentRequest(uid, profile.nickname));
        } else if (status === "pending-received") {
            console.log("  ➡️ Button mode: REQUEST SENT (received, go to Requests tab)");
            button.classList.add("btn-secondary");
            button.textContent = "Request Sent";
            button.disabled = true;
            button.title = "Open Friend Requests tab to accept/decline";
        } else {
            console.log("  ➡️ Button mode: SEND REQUEST");
            button.classList.add("btn-primary");
            button.textContent = "Send Request";
            button.addEventListener("click", () => sendFriendRequest(uid, profile.nickname));
        }
        actions.appendChild(button);
        
    } else if (context === "requests") {
        // Friend Requests: Accept ✓ / Decline ✗
        const acceptBtn = document.createElement("button");
        acceptBtn.className = "btn btn-success";
        acceptBtn.innerHTML = "✓";
        acceptBtn.style.fontSize = "20px";
        acceptBtn.style.width = "45px";
        acceptBtn.title = "Accept friend request";
        acceptBtn.addEventListener("click", () => acceptFriendRequest(uid, profile.nickname));
        
        const declineBtn = document.createElement("button");
        declineBtn.className = "btn btn-danger";
        declineBtn.innerHTML = "✗";
        declineBtn.style.fontSize = "20px";
        declineBtn.style.width = "45px";
        declineBtn.title = "Decline friend request";
        declineBtn.addEventListener("click", () => declineFriendRequest(uid, profile.nickname));
        
        actions.appendChild(acceptBtn);
        actions.appendChild(declineBtn);
        
    } else if (context === "friends") {
        // My Friends: View Library + Remove
        const viewLibraryBtn = document.createElement("button");
        viewLibraryBtn.className = "btn btn-primary";
        viewLibraryBtn.textContent = "View Library";
        viewLibraryBtn.addEventListener("click", () => viewFriendLibrary(uid, profile.nickname));
        
        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-danger";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => removeFriend(uid, profile.nickname));
        
        actions.appendChild(viewLibraryBtn);
        actions.appendChild(removeBtn);
    }
    
    item.appendChild(avatar);
    item.appendChild(info);
    item.appendChild(actions);
    
    return item;
}

async function sendFriendRequest(targetUid, targetNickname) {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        await setDoc(doc(db, `users/${user.uid}/friends/${targetUid}`), {
            friendUid: targetUid,
            status: "pending",
            requester: true,
            createdAt: new Date().toISOString()
        });
        
        await setDoc(doc(db, `users/${targetUid}/friends/${user.uid}`), {
            friendUid: user.uid,
            status: "pending",
            requester: false,
            createdAt: new Date().toISOString()
        });
        
        showMessage(`Friend request sent to ${targetNickname}!`, "success");
        searchUsers();
    } catch (error) {
        console.error("Error sending request:", error);
        const code = error && (error.code || error.message || "");
        const hint = (code.includes("permission") || code.includes("denied"))
            ? " Hint: Deploy updated Firestore rules."
            : "";
        showMessage(`Failed to send friend request. ${code}${hint}`, "error");
    }
}

async function cancelSentRequest(targetUid, targetNickname) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await deleteDoc(doc(db, `users/${user.uid}/friends/${targetUid}`));
        await deleteDoc(doc(db, `users/${targetUid}/friends/${user.uid}`));

        showMessage(`Cancelled friend request to ${targetNickname}.`, "success");
        searchUsers();
        loadFriendRequests();
    } catch (error) {
        console.error("Error cancelling request:", error);
        const code = error && (error.code || error.message || "");
        showMessage(`Failed to cancel request. ${code}`, "error");
    }
}

async function acceptFriendRequest(friendUid, friendNickname) {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        await setDoc(doc(db, `users/${user.uid}/friends/${friendUid}`), {
            friendUid: friendUid,
            status: "accepted",
            requester: false,
            acceptedAt: new Date().toISOString()
        }, { merge: true });
        
        await setDoc(doc(db, `users/${friendUid}/friends/${user.uid}`), {
            friendUid: user.uid,
            status: "accepted",
            requester: true,
            acceptedAt: new Date().toISOString()
        }, { merge: true });
        
        showMessage(`You are now friends with ${friendNickname}!`, "success");
        loadFriendRequests();
    } catch (error) {
        console.error("Error accepting request:", error);
        const code = error && (error.code || error.message || "");
        const hint = (code.includes("permission") || code.includes("denied"))
            ? " Hint: Deploy updated Firestore rules."
            : "";
        showMessage(`Failed to accept friend request. ${code}${hint}`, "error");
    }
}

async function declineFriendRequest(friendUid, friendNickname) {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        await deleteDoc(doc(db, `users/${user.uid}/friends/${friendUid}`));
        await deleteDoc(doc(db, `users/${friendUid}/friends/${user.uid}`));
        
        showMessage(`Declined friend request from ${friendNickname}.`, "success");
        loadFriendRequests();
        searchResults.innerHTML = "";
    } catch (error) {
        console.error("Error declining request:", error);
        const code = error && (error.code || error.message || "");
        showMessage(`Failed to decline request. ${code}`, "error");
    }
}

async function removeFriend(friendUid, friendNickname) {
    const user = auth.currentUser;
    if (!user) return;
    
    if (!confirm(`Remove ${friendNickname} from your friends?`)) return;
    
    try {
        await deleteDoc(doc(db, `users/${user.uid}/friends/${friendUid}`));
        await deleteDoc(doc(db, `users/${friendUid}/friends/${user.uid}`));
        
        showMessage(`Removed ${friendNickname} from friends.`, "success");
        loadMyFriends();
        searchResults.innerHTML = "";
    } catch (error) {
        console.error("Error removing friend:", error);
        const code = error && (error.code || error.message || "");
        const hint = (code.includes("permission") || code.includes("denied"))
            ? " Hint: Either party can delete the relationship; ensure rules are deployed."
            : "";
        showMessage(`Failed to remove friend. ${code}${hint}`, "error");
    }
}

async function viewFriendLibrary(friendUid, friendNickname) {
    try {
        console.log(`📚 Loading library for ${friendNickname} (${friendUid})`);
        
        // Show modal
        const modal = document.getElementById("libraryModal");
        const modalTitle = document.getElementById("libraryModalTitle");
        const libraryBooks = document.getElementById("friendLibraryBooks");
        
        modalTitle.textContent = `${friendNickname}'s Library`;
        libraryBooks.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #667eea;"></i></div>';
        modal.style.display = "block";
        
        // Fetch friend's library
        const libraryRef = collection(db, `users/${friendUid}/library`);
        const librarySnapshot = await getDocs(libraryRef);
        
        if (librarySnapshot.empty) {
            libraryBooks.innerHTML = `
                <div class="empty-library">
                    <i class="fas fa-book-open"></i>
                    <h3>No Books Yet</h3>
                    <p>${friendNickname} hasn't added any books to their library.</p>
                </div>
            `;
            return;
        }
        
        // Display books
        libraryBooks.innerHTML = "";
        librarySnapshot.forEach((doc) => {
            const book = doc.data();
            const bookCard = document.createElement("div");
            bookCard.className = "book-card";
            
            bookCard.innerHTML = `
                <img src="${book.thumbnail || 'https://via.placeholder.com/128x196?text=No+Cover'}" alt="${book.title}">
                <div class="book-info">
                    <div class="book-title">${book.title || 'Unknown Title'}</div>
                    <div class="book-author">${book.author || 'Unknown Author'}</div>
                </div>
            `;
            
            // Open book in Google Books when clicked
            if (book.googleBooksId) {
                bookCard.addEventListener("click", () => {
                    window.open(`https://books.google.com/books?id=${book.googleBooksId}`, '_blank');
                });
            }
            
            libraryBooks.appendChild(bookCard);
        });
        
        console.log(`📚 Loaded ${librarySnapshot.size} books from ${friendNickname}'s library`);
        
    } catch (error) {
        console.error("Error loading friend's library:", error);
        showMessage("Failed to load friend's library.", "error");
    }
}

// Auth
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        loadMyFriends();
    }
});

// Logout
document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("loggedInUserId");
    signOut(auth)
        .then(() => window.location.href = "index.html")
        .catch((error) => console.error("Logout error:", error));
});

// Search
searchBtn.addEventListener("click", searchUsers);
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        searchUsers();
    }
});

// Close modal when clicking outside
window.addEventListener("click", (event) => {
    const modal = document.getElementById("libraryModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});
