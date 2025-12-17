import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

import { 
    getFirestore, 
    setDoc, 
    doc,
    getDoc,
    query,
    collection,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

import { firebaseConfig } from './firebaseConfig.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Persistence error:", error);
});

// Utility function to check if nickname is unique
async function isNicknameUnique(nickname) {
    try {
        const normalizedNickname = nickname.trim().toLowerCase();
        console.log("Checking nickname uniqueness for:", normalizedNickname);
        
        const q = query(
            collection(db, "users"), 
            where("nicknameLower", "==", normalizedNickname)
        );
        
        const querySnapshot = await getDocs(q);
        const isUnique = querySnapshot.empty;
        
        console.log("Nickname unique:", isUnique);
        return isUnique;
    } catch (error) {
        console.error("Error checking nickname:", error);
        throw error;
    }
}

// Utility function to show messages
function showMessage(message, divId) {
    const messageDiv = document.getElementById(divId);
    if (messageDiv) {
        messageDiv.style.display = "block";
        messageDiv.innerHTML = message;
        messageDiv.style.opacity = 1;
        setTimeout(function() {
            messageDiv.style.opacity = 0;
            setTimeout(() => {
                messageDiv.style.display = "none";
            }, 300);
        }, 5000);
    }
}

// Function to handle SIGN UP with social providers (Google)
async function handleSocialSignUp(user, provider, messageDiv) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            // User already has an account - this shouldn't happen on sign up
            showMessage('This account already exists. Please use Sign In instead.', messageDiv);
            await auth.signOut();
            return false;
        }
        
        // New user - prompt for nickname
        let nickname = null;
        let isUnique = false;
        
        while (!nickname || nickname.trim().length < 3 || !isUnique) {
            nickname = prompt("Welcome! Please enter a unique nickname (minimum 3 characters):");
            
            if (nickname === null) {
                alert("A nickname is required to complete registration.");
                await auth.signOut();
                return false;
            }
            
            if (nickname.trim().length < 3) {
                alert("Nickname must be at least 3 characters long.");
                continue;
            }
            
            // Check if nickname is unique
            isUnique = await isNicknameUnique(nickname);
            if (!isUnique) {
                alert("This nickname is already taken. Please choose another one.");
            }
        }
        
        await setDoc(userDocRef, {
            email: user.email,
            nickname: nickname.trim(),
            nicknameLower: nickname.trim().toLowerCase(),
            uid: user.uid,
            createdAt: new Date().toISOString(),
            provider: provider,
            displayName: user.displayName || nickname.trim(),
            photoURL: user.photoURL || null
        });
        
        console.log("User registered:", user.email);
        localStorage.setItem("loggedInUserId", user.uid);
        return true;
    } catch (error) {
        console.error("Error handling social sign up:", error);
        showMessage("Error: " + error.message, messageDiv);
        return false;
    }
}

// Function to handle SIGN IN with social providers (Google)
async function handleSocialSignIn(user, provider, messageDiv) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            // User doesn't have an account - redirect to sign up
            showMessage('No account found. Please Sign Up first.', messageDiv);
            await auth.signOut();
            return false;
        }
        
        // User exists - sign in successful
        console.log("User signed in:", user.email);
        localStorage.setItem("loggedInUserId", user.uid);
        return true;
    } catch (error) {
        console.error("Error handling social sign in:", error);
        showMessage("Error: " + error.message, messageDiv);
        return false;
    }
}

// Check for redirect result on page load
(async () => {
    try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
            console.log("Redirect successful:", result.user.email);
            
            const providerId = result.providerId || result.user.providerData[0]?.providerId;
            const provider = 'google';
            
            // Check if this was a sign up or sign in attempt
            // We'll use sessionStorage to track this
            const isSignUpAttempt = sessionStorage.getItem('socialAuthType') === 'signup';
            sessionStorage.removeItem('socialAuthType');
            
            let success;
            if (isSignUpAttempt) {
                success = await handleSocialSignUp(result.user, provider, 'signInMessage');
            } else {
                success = await handleSocialSignIn(result.user, provider, 'signInMessage');
            }
            
            if (success) {
                window.location.href = "homepage.html";
            }
        }
    } catch (error) {
        console.error("Redirect error:", error);
        
        if (error.code === 'auth/unauthorized-domain') {
            alert("Configuration Error: This domain is not authorized in Firebase Console.\n\nPlease add '" + window.location.origin + "' to authorized domains.");
        } else if (error.code === 'auth/operation-not-allowed') {
            alert("Social Sign-In is not enabled in Firebase Console.");
        } else {
            showMessage("Sign-In error: " + error.message, 'signInMessage');
        }
    }
})();

// Monitor auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User signed in:", user.email);
    }
});

// Form Toggle
const signUpContainer = document.getElementById('signup');
const signInContainer = document.getElementById('signin');
const signUpLink = document.getElementById('signUpLink');
const signInLink = document.getElementById('signInLink');

if (signInLink) {
    signInLink.addEventListener('click', (e) => {
        e.preventDefault();
        signUpContainer.classList.add('hidden');
        signInContainer.classList.remove('hidden');
    });
}

if (signUpLink) {
    signUpLink.addEventListener('click', (e) => {
        e.preventDefault();
        signInContainer.classList.add('hidden');
        signUpContainer.classList.remove('hidden');
    });
}

// Sign Up with Email/Password
const signUp = document.getElementById('submitSignUp');
if (signUp) {
    signUp.addEventListener('click', async (event) => {
        event.preventDefault();
        
        console.log("Sign up button clicked");
        
        const email = document.getElementById('rEmail').value;
        const password = document.getElementById('rPassword').value;
        const nickname = document.getElementById('nickname').value;

        console.log("Form values - Email:", email, "Nickname:", nickname);

        if (!email || !password || !nickname) {
            showMessage('Please fill all fields', 'signUpMessage');
            return;
        }

        if (nickname.trim().length < 3) {
            showMessage('Nickname must be at least 3 characters', 'signUpMessage');
            return;
        }

        try {
            // Check if nickname is unique
            showMessage('Checking nickname availability...', 'signUpMessage');
            const isUnique = await isNicknameUnique(nickname);
            
            if (!isUnique) {
                showMessage('This nickname is already taken. Please choose another one.', 'signUpMessage');
                return;
            }

            showMessage('Creating account...', 'signUpMessage');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const userData = {
                email: email,
                nickname: nickname.trim(),
                nicknameLower: nickname.trim().toLowerCase(),
                uid: user.uid,
                createdAt: new Date().toISOString(),
                provider: 'email'
            };
            
            showMessage('Saving user data...', 'signUpMessage');
            
            const docRef = doc(db, "users", user.uid);
            await setDoc(docRef, userData);
            
            showMessage('Account Created Successfully', 'signUpMessage');
            
            document.getElementById('rEmail').value = '';
            document.getElementById('rPassword').value = '';
            document.getElementById('nickname').value = '';
            
            localStorage.setItem('loggedInUserId', user.uid);
            console.log("Account created:", email);
            
            setTimeout(() => {
                window.location.href = "homepage.html";
            }, 1500);
            
        } catch (error) {
            console.error("Sign up error:", error);
            const errorCode = error.code;
            if (errorCode === 'auth/email-already-in-use') {
                showMessage("Email Address already in use!", 'signUpMessage');
            } else if (errorCode === 'auth/weak-password') {
                showMessage("Password should be at least 6 characters", 'signUpMessage');
            } else if (errorCode === 'auth/invalid-email') {
                showMessage("Invalid email address", 'signUpMessage');
            } else {
                showMessage("Unable to create user: " + error.message, 'signUpMessage');
            }
        }
    });
}

// Sign In with Email/Password
const signIn = document.getElementById('submitSignIn');
if (signIn) {
    signIn.addEventListener('click', async (event) => {
        event.preventDefault();
        
        const email = document.getElementById('logEmail').value;
        const password = document.getElementById('logPassword').value;

        if (!email || !password) {
            showMessage('Please fill all fields', 'signInMessage');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            localStorage.setItem('loggedInUserId', user.uid);
            console.log("Signed in:", email);
            window.location.href = "homepage.html";
            
        } catch (error) {
            console.error("Sign in error:", error);
            const errorCode = error.code;
            if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
                showMessage('Invalid email or password', 'signInMessage');
            } else if (errorCode === 'auth/user-not-found') {
                showMessage('No account found with this email', 'signInMessage');
            } else if (errorCode === 'auth/invalid-email') {
                showMessage('Invalid email address', 'signInMessage');
            } else if (errorCode === 'auth/too-many-requests') {
                showMessage('Too many failed attempts. Please try again later', 'signInMessage');
            } else {
                showMessage('Unable to sign in', 'signInMessage');
            }
        }
    });
}

// Google Sign-Up (from Sign Up form)
const googleSignUpBtn = document.getElementById('googleSignUpBtn');

if (googleSignUpBtn) {
    googleSignUpBtn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        try {
            const result = await signInWithPopup(auth, provider);
            const success = await handleSocialSignUp(result.user, 'google', 'signUpMessage');
            
            if (success) {
                showMessage('Sign up successful! Redirecting...', 'signUpMessage');
                setTimeout(() => {
                    window.location.href = "homepage.html";
                }, 1000);
            }
            
        } catch (error) {
            console.error("Google Sign-Up error:", error.code);
            
            if (error.code === 'auth/popup-blocked') {
                showMessage('Popup blocked. Using redirect instead...', 'signUpMessage');
                sessionStorage.setItem('socialAuthType', 'signup');
                try {
                    await signInWithRedirect(auth, provider);
                } catch (redirectError) {
                    console.error("Redirect failed:", redirectError);
                    showMessage("Unable to sign in with Google", 'signUpMessage');
                }
            } else if (error.code === 'auth/popup-closed-by-user') {
                showMessage('Sign-in cancelled', 'signUpMessage');
            } else if (error.code === 'auth/unauthorized-domain') {
                alert("Configuration Error: Please add '" + window.location.origin + "' to authorized domains in Firebase Console.");
            } else {
                showMessage("Google Sign-Up failed: " + error.message, 'signUpMessage');
            }
        }
    });
}

// Google Sign-In (from Sign In form)
const googleSignInBtn = document.getElementById('googleSignInBtn');

if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        try {
            const result = await signInWithPopup(auth, provider);
            const success = await handleSocialSignIn(result.user, 'google', 'signInMessage');
            
            if (success) {
                showMessage('Sign in successful! Redirecting...', 'signInMessage');
                setTimeout(() => {
                    window.location.href = "homepage.html";
                }, 1000);
            }
            
        } catch (error) {
            console.error("Google Sign-In error:", error.code);
            
            if (error.code === 'auth/popup-blocked') {
                showMessage('Popup blocked. Using redirect instead...', 'signInMessage');
                sessionStorage.setItem('socialAuthType', 'signin');
                try {
                    await signInWithRedirect(auth, provider);
                } catch (redirectError) {
                    console.error("Redirect failed:", redirectError);
                    showMessage("Unable to sign in with Google", 'signInMessage');
                }
            } else if (error.code === 'auth/popup-closed-by-user') {
                showMessage('Sign-in cancelled', 'signInMessage');
            } else if (error.code === 'auth/unauthorized-domain') {
                alert("Configuration Error: Please add '" + window.location.origin + "' to authorized domains in Firebase Console.");
            } else {
                showMessage("Google Sign-In failed: " + error.message, 'signInMessage');
            }
        }
    });
}
