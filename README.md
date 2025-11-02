# Book Library Project

A web app for managing book collections with friends. Built with Firebase and Google Books API.

## What it does

- Search and save books from Google Books
- Build your personal library
- Add friends and view their libraries
- Edit your profile

## Setup

1. Clone this repo
2. Get Firebase config from your Firebase project
3. Copy `public/firebaseConfig.example.js` to `public/firebaseConfig.js` and add your credentials
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`
5. Run `run.bat` (Windows) or `python3 -m http.server 5500` from public folder
6. Open http://localhost:5500

## Pages

- index.html - Login/Register
- homepage.html - Search books
- collections.html - Your library
- friends.html - Friend system
- profile.html - Edit profile

## Tech

HTML, CSS, JavaScript, Firebase Auth, Firestore, Google Books API

5. **Open browser**- **Responsive Layout**: Works seamlessly on desktop and mobile devices- Accept/decline friend requests

   ```

   http://localhost:5500/index.html- **Tab Navigation**: Intuitive tabs for Friends, Requests, and Search- View friends list

   ```

- **Modal Dialogs**: Elegant popups for viewing libraries and editing profiles- View friends' book libraries

## Pages

- **Empty States**: Helpful messages and icons when no data is available- Remove friends

- **index.html** - Login/Register

- **homepage.html** - Search and add books## 🚀 Getting Started---

- **collections.html** - View your library

- **friends.html** - Manage friends and view their libraries### Prerequisites## 🚀 Quick Start

- **profile.html** - Edit your profile

- Python 3.x (for local server)### Option 1: Windows (Easiest)

## Tech Stack

- Firebase account

- HTML/CSS/JavaScript

- Firebase Authentication- Modern web browser (Chrome, Firefox, Edge, Safari)```bash

- Cloud Firestore

- Google Books API# Just run:

- Python HTTP Server

### Installation.\run.bat

## Firestore Structure

`````

```

users/{userId}1. **Clone the repository**

  ├── email

  ├── nickname   ```bashThis automatically starts a local server on `http://localhost:5500`

  ├── nicknameLower

  ├── library/{bookId}   git clone https://github.com/Davide-glitch/Project-SSD.git

  │     ├── title

  │     ├── author   cd Project-SSD### Option 2: Python

  │     ├── thumbnail

  │     └── googleBooksId````

  └── friends/{friendId}

        ├── nickname````bash

        ├── email

        ├── status (pending/accepted)2. **Set up Firebase**cd public

        └── requester (boolean)

```   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)python -m http.server 5500



## Author   - Enable Authentication (Email/Password and Google providers)```



**Davide**     - Create a Firestore Database in production mode

GitHub: [@Davide-glitch](https://github.com/Davide-glitch)

   - Copy your Firebase configOpen: `http://localhost:5500/index.html`



3. **Configure Firebase**### Option 3: Firebase CLI



   Create `public/firebaseConfig.js`:```bash

   ```javascriptnpm install -g firebase-tools

   export const firebaseConfig = {firebase login

       apiKey: "YOUR_API_KEY",firebase serve

       authDomain: "YOUR_AUTH_DOMAIN",```

       projectId: "YOUR_PROJECT_ID",

       storageBucket: "YOUR_STORAGE_BUCKET",---

       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",

       appId: "YOUR_APP_ID"## ⚙️ Setup

   };

   ```### 1. Clone the Repository



4. **Set up Firestore Security Rules**```bash

   git clone https://github.com/NoMercy17/book_library.git

   Deploy these rules to Firebase:cd book_library

   ```javascript```

   rules_version = '2';

   service cloud.firestore {### 2. Firebase Configuration

     match /databases/{database}/documents {

       match /users/{userId} {The real Firebase config is already in `public/firebaseConfig.js` (extracted from git history).

         allow read, write: if request.auth != null && request.auth.uid == userId;

         **If you need to reconfigure**:

         match /library/{bookId} {

           allow read: if request.auth != null && (- Copy `public/firebaseConfig.example.js` to `public/firebaseConfig.js`

             request.auth.uid == userId ||- Get config from Firebase Console → Project Settings → Your apps (Web)

             exists(/databases/$(database)/documents/users/$(request.auth.uid)/friends/$(userId)) &&

             get(/databases/$(database)/documents/users/$(request.auth.uid)/friends/$(userId)).data.status == 'accepted'### 3. Deploy Firestore Rules (REQUIRED)

           );

           allow write: if request.auth != null && request.auth.uid == userId;**Option A: Firebase Console**

         }

         1. Go to [Firebase Console](https://console.firebase.google.com/project/book-library-project-b336d)

         match /friends/{friendId} {2. Navigate to **Firestore Database** → **Rules** tab

           allow read: if request.auth != null && request.auth.uid == userId;3. Copy contents of `firestore.rules`

           allow create, update, delete: if request.auth != null && 4. Paste and click **Publish**

             (request.auth.uid == userId || request.auth.uid == friendId);

         }**Option B: CLI**

       }

     }```bash

   }firebase deploy --only firestore:rules

`````

5. **Run the application**---

   Windows:## 📖 User Guide

   ```bash

   .\run.bat### Getting Started

   ```

   1. **Sign Up** with email/password or Google

   Linux/Mac: - Choose a unique nickname (used for friend search)

   ````bash2. **Search for books** on the homepage

   cd public3. **Save books** to your library

   python3 -m http.server 55004. **View Collections** to manage saved books

   ```5. **Add friends** to share libraries



   Then open: `http://localhost:5500/index.html`### Testing Friends Feature
   ````

## 📁 Project Structure1. Create 2+ test accounts with unique nicknames

2. **User A**: Go to Friends → Search Users

````3. Search for **User B's nickname** and click "Add Friend"

book_library/4. **User B**: Go to Friends → Friend Requests

├── public/5. **User B**: Click "Accept"

│   ├── index.html           # Landing page with auth6. Both users now see each other in "My Friends" tab

│   ├── homepage.html        # Main dashboard

│   ├── collections.html     # Book collection page---

│   ├── friends.html         # Friends management

│   ├── profile.html         # User profile## 📁 Project Structure

│   ├── collections.js       # Collections logic

│   ├── friends.js           # Friends system logic```

│   ├── homepage.js          # Homepage logicbook_library/

│   ├── profile.js           # Profile management├── public/

│   ├── firebaseConfig.js    # Firebase configuration│   ├── index.html          # Landing page (auth)

│   └── img/                 # Images and assets│   ├── homepage.html       # Book search

├── run.bat                  # Windows launcher│   ├── profile.html        # User profile

├── firestore.rules          # Firestore security rules│   ├── collections.html    # Saved books

└── README.md               # This file│   ├── friends.html        # Friends management

```│   ├── *.js                # Page logic

│   └── firebaseConfig.js   # Firebase config

## 🎯 Usage Guide├── docs/

│   ├── use-cases.md                     # 9 use cases

### Getting Started│   ├── diagrams.md                      # Mermaid diagrams

1. **Sign Up**: Create an account with email/password or Google│   ├── lab-requirements-checklist.md    # Lab checklist

2. **Search Books**: Use the Google Books search on homepage│   ├── facebook-login-setup.md          # FB OAuth guide

3. **Build Library**: Add books to your personal collection│   ├── firestore-rules-deployment.md    # Rules guide

4. **Find Friends**: Search for users by nickname│   └── friends-feature-complete.md      # Friends docs

5. **Connect**: Send friend requests and build your network├── firestore.rules         # Security rules

6. **Explore**: View your friends' book collections├── firebase.json           # Firebase config

├── run.bat                 # Windows quick start

### Key Pages├── PROJECT-COMPLETE.md     # Full documentation

└── QUICK-START.md          # 5-minute setup guide

#### 🏠 Homepage```

- Search Google Books API

- Add books to your library---

- Quick navigation to other sections

## 🗄️ Database Structure

#### 📚 Collections

- View all your saved books```

- Filter by title or authorusers/

- Delete books from collection├── {userId}/

- Visual grid layout with covers│   ├── nickname: string

│   ├── nicknameLower: string

#### 👥 Friends│   ├── email: string

- **My Friends**: See accepted friends, view their libraries, or remove them│   ├── library/         # Subcollection

- **Friend Requests**: Accept (✓) or decline (✗) incoming requests│   │   └── {bookId}/

- **Search Users**: Find users and send friend requests│   │       ├── title, authors, description, thumbnail

│   └── friends/         # Subcollection

#### 👤 Profile│       └── {friendId}/

- View your nickname and email│           ├── friendUid, status, requester

- Edit profile information```

- Nickname uniqueness validation

---

## 🛠️ Technology Stack

## 📚 Documentation

### Frontend

- **HTML5**: Semantic markup**Quick Reference**:

- **CSS3**: Modern styling with gradients and animations

- **JavaScript (ES6+)**: Modular code with ES modules- **[QUICK-START.md](QUICK-START.md)** - 5-minute setup guide

- **Font Awesome**: Icon library- **[PROJECT-COMPLETE.md](PROJECT-COMPLETE.md)** - Comprehensive docs

- **[docs/use-cases.md](docs/use-cases.md)** - 9 use cases (3 per team member)

### Backend & Services- **[docs/diagrams.md](docs/diagrams.md)** - Architecture diagrams

- **Firebase Authentication**: User management- **[docs/friends-feature-complete.md](docs/friends-feature-complete.md)** - Friends feature guide

- **Cloud Firestore**: NoSQL database

- **Google Books API**: Book data source---

- **Python HTTP Server**: Local development

## 🔒 Security

## 🔒 Security Features

### Firestore Rules Summary:

- **Authentication Required**: All pages protected

- **Firestore Rules**: Granular access control- Users can only modify their own profile and library

- **Friend Verification**: Only friends can view libraries- Friends with accepted status can read each other's libraries

- **Input Validation**: Nickname uniqueness checks- All operations require authentication

- **Secure Sessions**: Firebase-managed tokens- Public user profiles for nickname search



## 🤝 Friend System ArchitectureSee `firestore.rules` for full security configuration.



The friend system uses a **dual-document pattern** for reliability:---



1. **Send Request**: Creates documents in both users' `friends` subcollections## 🧪 Testing

   - Sender doc: `{ status: 'pending', requester: true }`

   - Receiver doc: `{ status: 'pending', requester: false }`### Manual Test Flow:



2. **Accept Request**: Updates both documents to `status: 'accepted'`1. ✅ Sign up with unique nickname

2. ✅ Search books (e.g., "Harry Potter")

3. **Decline/Remove**: Deletes both documents3. ✅ Save book to library

4. ✅ Check profile (book count updates)

This ensures consistency and allows efficient queries for friend lists and pending requests.5. ✅ View Collections (saved book appears)

6. ✅ Remove book from library

## 📊 Database Schema7. ✅ Search for friend by nickname

8. ✅ Send friend request

### Users Collection9. ✅ Accept friend request (2nd account)

```javascript10. ✅ View friend in "My Friends" list

users/{userId} {

  email: string,---

  nickname: string,

  nicknameLower: string  // For case-insensitive searches## 🐛 Troubleshooting

}

```**"Missing or insufficient permissions" error**

→ Deploy Firestore rules (see Setup step 3)

### Library Subcollection

```javascript**"No users found" when searching friends**

users/{userId}/library/{bookId} {→ Ensure user has signed up with that nickname

  title: string,

  author: string,**Facebook Login closes immediately**

  thumbnail: string,→ Expected (requires app activation in Facebook Developer Console)

  googleBooksId: string,

  addedAt: timestamp**Python not found**

}→ Install Python or use: `npx serve public -p 5500`

````

---

### Friends Subcollection

````javascript## 🎓 Lab Requirements

users/{userId}/friends/{friendId} {

  nickname: string,### Completed:

  email: string,

  status: 'pending' | 'accepted',✅ Firebase Authentication (Email, Google, Facebook)

  requester: boolean,  // true if this user sent the request✅ Cloud Firestore (users, library, friends)

  timestamp: timestamp✅ API Integration (Google Books)

}✅ 9 Use Cases (3 per team member)

```✅ Diagrams (Actor, Sequence, Data Model)

✅ Documentation

## 🐛 Known Issues & Limitations✅ Security Rules



- **Email Update**: Requires recent login (Firebase security requirement)### Optional (Bonus):

- **Book Duplicates**: Same book can be added multiple times

- **Pagination**: Large libraries load all books at once⚠️ Firebase Storage (avatar uploads)

- **Search**: Basic text matching (no fuzzy search)⚠️ Cloud Functions (welcome email)



## 🚀 Future Enhancements---



- [ ] Book reviews and ratings## 🚢 Deployment

- [ ] Reading lists and categories

- [ ] Book recommendations based on friends### Deploy to Firebase Hosting:

- [ ] Activity feed (friend adds, reading updates)

- [ ] Book exchange/lending system```bash

- [ ] Dark mode themefirebase deploy

- [ ] Advanced search filters```

- [ ] Pagination for large collections

- [ ] Export library to PDF/CSV### Deploy only rules:


