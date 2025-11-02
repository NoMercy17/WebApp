import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

import { firebaseConfig } from './firebaseConfig.js';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Check authentication state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const loggedInUserId = user.uid;
    localStorage.setItem("loggedInUserId", loggedInUserId);
    // Load initial content
    loadInitialBooks();
    updateLibraryCount();
  } else {
    console.log("No user logged in");
    window.location.href = "index.html";
  }
});

// Sidebar toggle functionality
const homeIcon = document.getElementById("homeIcon");
const settingsIcon = document.getElementById("settingsIcon");
const leftSidebar = document.getElementById("leftSidebar");
const rightSidebar = document.getElementById("rightSidebar");
const overlay = document.getElementById("overlay");

homeIcon.addEventListener("click", () => {
  leftSidebar.classList.toggle("active");
  overlay.classList.toggle("active");
  rightSidebar.classList.remove("active");
});

settingsIcon.addEventListener("click", () => {
  rightSidebar.classList.toggle("active");
  overlay.classList.toggle("active");
  leftSidebar.classList.remove("active");
});

overlay.addEventListener("click", () => {
  leftSidebar.classList.remove("active");
  rightSidebar.classList.remove("active");
  overlay.classList.remove("active");
});

// Navigation buttons
document.getElementById("profileBtn").addEventListener("click", () => {
  window.location.href = "profile.html";
});

document.getElementById("collectionsBtn").addEventListener("click", () => {
  window.location.href = "collections.html";
});

document.getElementById("friendsBtn").addEventListener("click", () => {
  window.location.href = "friends.html";
});

// Logout functionality
document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("loggedInUserId");
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
});

// ===== Books search & library =====
const booksGrid = document.getElementById("booksGrid");
const booksMessage = document.getElementById("booksMessage");
const searchInput = document.getElementById("searchInput");
const searchIcon = document.getElementById("searchIcon");

function showBooksMessage(text, isError = false) {
  if (!booksMessage) return;
  booksMessage.textContent = text || "";
  booksMessage.style.color = isError ? "#b00020" : "#333";
}

async function searchBooks(query) {
  if (!query || !query.trim()) return [];
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`;
  try {
    showBooksMessage("Searching...");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = data.items || [];
    const results = items.map((it) => {
      const info = it.volumeInfo || {};
      return {
        id: it.id,
        title: info.title || "Untitled",
        authors: info.authors || [],
        thumbnail: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "",
        infoLink: info.infoLink || ""
      };
    });
    showBooksMessage(results.length ? `Found ${results.length} books` : `No results for "${query}"`);
    return results;
  } catch (e) {
    console.error("Search error", e);
    showBooksMessage("Failed to search books. Please try again.", true);
    return [];
  }
}

function renderBooks(books) {
  if (!booksGrid) return;
  booksGrid.innerHTML = "";
  if (!books || !books.length) return;

  books.forEach((b) => {
    const card = document.createElement("div");
    card.className = "book-placeholder";
    card.style.position = "relative";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.justifyContent = "flex-start";
    card.style.padding = "10px";
    card.style.gap = "8px";

    const img = document.createElement("img");
    img.src = b.thumbnail || "https://via.placeholder.com/128x192?text=No+Image";
    img.alt = b.title;
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "6px";

    const title = document.createElement("div");
    title.textContent = b.title;
    title.style.fontWeight = "600";
    title.style.textAlign = "center";
    title.style.color = "#fff";

    const author = document.createElement("div");
    author.textContent = (b.authors && b.authors.length) ? b.authors.join(", ") : "Unknown author";
    author.style.fontSize = "12px";
    author.style.opacity = "0.9";
    author.style.textAlign = "center";
    author.style.color = "#eee";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.className = "btn";
    saveBtn.style.marginTop = "auto";
    saveBtn.style.padding = "8px 10px";
    saveBtn.style.fontSize = "14px";

    saveBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await saveBookToLibrary(b);
    });

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(author);
    card.appendChild(saveBtn);
    booksGrid.appendChild(card);
  });
}

async function saveBookToLibrary(book) {
  const user = auth.currentUser;
  if (!user) {
    showBooksMessage("Please sign in to save books.", true);
    return;
  }
  try {
    const ref = doc(db, `users/${user.uid}/library/${book.id}`);
    await setDoc(ref, {
      id: book.id,
      title: book.title,
      authors: book.authors || [],
      thumbnail: book.thumbnail || "",
      infoLink: book.infoLink || "",
      savedAt: new Date().toISOString()
    }, { merge: true });
    showBooksMessage(`Saved "${book.title}" to your library.`);
    updateLibraryCount();
  } catch (e) {
    console.error("Save error", e);
    showBooksMessage("Failed to save book.", true);
  }
}

async function updateLibraryCount() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const colRef = collection(db, `users/${user.uid}/library`);
    const snap = await getDocs(colRef);
    const count = snap.size || 0;
    // Optionally show the count in the welcome-card
    // You can extend the UI if needed; keeping it minimal here.
    console.log("Library count:", count);
  } catch (e) {
    console.warn("Could not fetch library count", e);
  }
}

async function loadInitialBooks() {
  // Load a default set on page load
  const defaults = await searchBooks("subject:fiction");
  renderBooks(defaults);
}

function triggerSearch() {
  const q = (searchInput?.value || "").trim();
  if (!q) {
    showBooksMessage("Type something to search.");
    return;
  }
  searchBooks(q).then(renderBooks);
}

if (searchIcon) {
  searchIcon.addEventListener("click", triggerSearch);
}

if (searchInput) {
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerSearch();
    }
  });
}