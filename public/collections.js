import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

import { firebaseConfig } from './firebaseConfig.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const messageDiv = document.getElementById("message");
const booksGrid = document.getElementById("booksGrid");
const booksContainer = document.getElementById("booksContainer");
const searchInput = document.getElementById("searchInput");

let allBooks = [];
let filteredBooks = [];

function showMessage(text, type = "info") {
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = text ? "block" : "none";
}

async function loadBooks() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    try {
        showMessage("Loading your collection...", "info");
        const colRef = collection(db, `users/${user.uid}/library`);
        const snapshot = await getDocs(colRef);

        allBooks = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            allBooks.push({
                id: data.id || docSnap.id,
                title: data.title || "Untitled",
                authors: data.authors || [],
                thumbnail: data.thumbnail || "",
                infoLink: data.infoLink || "",
                savedAt: data.savedAt || ""
            });
        });

        // Sort by savedAt (newest first)
        allBooks.sort((a, b) => {
            const dateA = new Date(a.savedAt || 0);
            const dateB = new Date(b.savedAt || 0);
            return dateB - dateA;
        });

        filteredBooks = [...allBooks];
        renderBooks();
        showMessage(`${allBooks.length} book${allBooks.length !== 1 ? 's' : ''} in your collection`, "success");
    } catch (error) {
        console.error("Error loading books:", error);
        const code = error && (error.code || error.message || "");
        const hint = (code.includes("permission") || code.includes("denied"))
            ? " Hint: Deploy Firestore rules."
            : "";
        showMessage(`Failed to load your collection. ${hint}`, "error");
    }
}

function renderBooks() {
    if (!booksGrid || !booksContainer) return;

    if (filteredBooks.length === 0) {
        booksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h2>No books in your collection</h2>
                <p>Start building your library by searching and saving books!</p>
                <a href="homepage.html">Search Books</a>
            </div>
        `;
        return;
    }

    booksGrid.innerHTML = "";
    filteredBooks.forEach((book) => {
        const card = document.createElement("div");
        card.className = "book-card";

        const img = document.createElement("img");
        img.src = book.thumbnail || "https://via.placeholder.com/128x192?text=No+Image";
        img.alt = book.title;
        img.onerror = () => {
            img.src = "https://via.placeholder.com/128x192?text=No+Image";
        };

        const title = document.createElement("div");
        title.className = "book-title";
        title.textContent = book.title;

        const author = document.createElement("div");
        author.className = "book-author";
        author.textContent = (book.authors && book.authors.length) 
            ? book.authors.join(", ") 
            : "Unknown author";

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            await removeBook(book);
        });

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(author);
        card.appendChild(removeBtn);

        // Optional: click to open info link
        if (book.infoLink) {
            card.style.cursor = "pointer";
            card.addEventListener("click", (e) => {
                if (e.target !== removeBtn) {
                    window.open(book.infoLink, "_blank");
                }
            });
        }

        booksGrid.appendChild(card);
    });
}

async function removeBook(book) {
    const user = auth.currentUser;
    if (!user) return;

    if (!confirm(`Remove "${book.title}" from your collection?`)) {
        return;
    }

    try {
        const docRef = doc(db, `users/${user.uid}/library/${book.id}`);
        await deleteDoc(docRef);
        showMessage(`Removed "${book.title}" from your collection.`, "success");
        
        // Remove from local arrays
        allBooks = allBooks.filter(b => b.id !== book.id);
        filteredBooks = filteredBooks.filter(b => b.id !== book.id);
        renderBooks();
    } catch (error) {
        console.error("Error removing book:", error);
        showMessage("Failed to remove book.", "error");
    }
}

function filterBooks(query) {
    if (!query || !query.trim()) {
        filteredBooks = [...allBooks];
    } else {
        const lowerQuery = query.toLowerCase();
        filteredBooks = allBooks.filter(book => {
            const titleMatch = book.title.toLowerCase().includes(lowerQuery);
            const authorMatch = book.authors.some(a => a.toLowerCase().includes(lowerQuery));
            return titleMatch || authorMatch;
        });
    }
    renderBooks();
    if (filteredBooks.length === 0 && allBooks.length > 0) {
        showMessage(`No books match "${query}"`, "info");
    } else if (filteredBooks.length > 0) {
        showMessage(`${filteredBooks.length} book${filteredBooks.length !== 1 ? 's' : ''} found`, "success");
    }
}

// Auth state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        loadBooks();
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
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        filterBooks(e.target.value);
    });
}
