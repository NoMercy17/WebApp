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
    onAuthStateChanged,
    sendEmailVerification,
    updateProfile,
    applyActionCode
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

// Persist login
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Check for email verification action code
(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');
    
    if (mode === 'verifyEmail' && oobCode) {
        try {
            await applyActionCode(auth, oobCode);
            showMessage("Email verified successfully! You can now sign in.", "signInMessage");
            document.getElementById("signin").classList.remove("hidden");
            document.getElementById("signup").classList.add("hidden");
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error("Email verification failed:", error);
            showMessage("Failed to verify email. The link may be expired or invalid.", "signInMessage");
        }
    }
})();

// Helpers
async function isNicknameUnique(nickname) {
    const normalized = nickname.trim().toLowerCase();
    const q = query(collection(db, "users"), where("nicknameLower", "==", normalized));
    const snap = await getDocs(q);
    return snap.empty;
}

function showMessage(message, divId) {
    const el = document.getElementById(divId);
    if (!el) return;
    el.style.display = "block";
    el.innerHTML = message;
    el.style.opacity = 1;
    setTimeout(() => {
        el.style.opacity = 0;
        setTimeout(() => el.style.display = "none", 300);
    }, 10000);
}

// Social (Google only)
async function handleGoogleSignUp(user, messageDiv) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        showMessage("Account already exists. Please sign in.", messageDiv);
        await auth.signOut();
        return false;
    }

    let nickname = null;
    let unique = false;

    while (!unique) {
        nickname = prompt("Choose a unique nickname (min 3 characters):");
        if (!nickname || nickname.trim().length < 3) continue;
        unique = await isNicknameUnique(nickname);
        if (!unique) alert("Nickname already taken.");
    }

    await setDoc(ref, {
        uid: user.uid,
        email: user.email,
        nickname: nickname.trim(),
        nicknameLower: nickname.trim().toLowerCase(),
        provider: "google",
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem("loggedInUserId", user.uid);
    return true;
}

async function handleGoogleSignIn(user, messageDiv) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        showMessage("No account found. Please sign up first.", messageDiv);
        await auth.signOut();
        return false;
    }

    localStorage.setItem("loggedInUserId", user.uid);
    return true;
}

// Redirect handling
(async () => {
    try {
        const result = await getRedirectResult(auth);
        if (!result || !result.user) return;

        const isSignup = sessionStorage.getItem("socialAuthType") === "signup";
        sessionStorage.removeItem("socialAuthType");

        const success = isSignup
            ? await handleGoogleSignUp(result.user, "signUpMessage")
            : await handleGoogleSignIn(result.user, "signInMessage");

        if (success) window.location.href = "homepage.html";
    } catch (e) {
        console.error("Redirect error:", e);
        showMessage(e.message, "signInMessage");
    }
})();

// Auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in:", user.email);
    }
});

// Form toggle
document.getElementById("signUpLink")?.addEventListener("click", e => {
    e.preventDefault();
    document.getElementById("signup").classList.remove("hidden");
    document.getElementById("signin").classList.add("hidden");
});

document.getElementById("signInLink")?.addEventListener("click", e => {
    e.preventDefault();
    document.getElementById("signin").classList.remove("hidden");
    document.getElementById("signup").classList.add("hidden");
});

// Email Sign-Up
document.getElementById("submitSignUp")?.addEventListener("click", async e => {
    e.preventDefault();

    const email = document.getElementById("rEmail").value;
    const password = document.getElementById("rPassword").value;
    const nickname = document.getElementById("nickname").value;

    // Validation
    if (!email || !password || !nickname) {
        showMessage("Please fill in all fields", "signUpMessage");
        return;
    }

    if (nickname.trim().length < 3) {
        showMessage("Nickname must be at least 3 characters", "signUpMessage");
        return;
    }

    if (password.length < 6) {
        showMessage("Password must be at least 6 characters", "signUpMessage");
        return;
    }

    if (!(await isNicknameUnique(nickname))) {
        showMessage("Nickname already taken", "signUpMessage");
        return;
    }

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        await updateProfile(cred.user, {
            displayName: nickname.trim()
        });

        const actionCodeSettings = {
            url: window.location.origin + '/index.html',
            handleCodeInApp: true
        };
        
        try {
            await sendEmailVerification(cred.user, actionCodeSettings);
        } catch (emailError) {
            console.error("Email send failed, trying fallback:", emailError);
            await sendEmailVerification(cred.user);
        }

        await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            email,
            nickname: nickname.trim(),
            nicknameLower: nickname.trim().toLowerCase(),
            provider: "email",
            emailVerified: false,
            createdAt: new Date().toISOString()
        });

        showMessage(
            `<strong>Account Created Successfully!</strong><br><br>
            Verification email sent to: <strong>${email}</strong><br><br>
            <strong>Next Steps:</strong><br>
            1. Check your email inbox (and spam/junk folder)<br>
            2. Click the verification link in the email<br>
            3. You'll be redirected back here automatically<br>
            4. Then sign in with your credentials<br><br>
            <strong>You cannot sign in until you verify your email.</strong><br><br>
            <em>If you don't receive the email within 5 minutes, use the "Resend" button on the sign-in page.</em>`,
            "signUpMessage"
        );

        document.getElementById("rEmail").value = "";
        document.getElementById("rPassword").value = "";
        document.getElementById("nickname").value = "";

        await auth.signOut();

    } catch (e) {
        console.error("Sign up error:", e);
        
        let errorMessage = "Sign up failed. ";
        if (e.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already registered. Please sign in instead.";
        } else if (e.code === 'auth/invalid-email') {
            errorMessage = "Invalid email address format.";
        } else if (e.code === 'auth/weak-password') {
            errorMessage = "Password is too weak. Use at least 6 characters.";
        } else if (e.code === 'auth/network-request-failed') {
            errorMessage = "Network error. Please check your internet connection.";
        } else if (e.code === 'auth/operation-not-allowed') {
            errorMessage = "Email/password sign-in is not enabled. Please contact support.";
        } else {
            errorMessage += e.message || "Unknown error occurred.";
        }
        
        showMessage(errorMessage, "signUpMessage");
    }
});

// Email Sign-In
document.getElementById("submitSignIn")?.addEventListener("click", async e => {
    e.preventDefault();

    const email = document.getElementById("logEmail").value;
    const password = document.getElementById("logPassword").value;

    if (!email || !password) {
        showMessage("Please enter email and password", "signInMessage");
        return;
    }

    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        
        if (!cred.user.emailVerified) {
            showMessage(
                `<strong>Email Not Verified</strong><br><br>
                You must verify your email before signing in.<br><br>
                <strong>Check your inbox for the verification email.</strong><br><br>
                Didn't receive it? Click "Resend Verification Email" below.`,
                "signInMessage"
            );
            await auth.signOut();
            return;
        }
        
        localStorage.setItem("loggedInUserId", cred.user.uid);
        
        const ref = doc(db, "users", cred.user.uid);
        await setDoc(ref, { emailVerified: true }, { merge: true });
        
        window.location.href = "homepage.html";
        
    } catch (e) {
        console.error("Sign in error:", e);
        
        let errorMessage = "Sign in failed. ";
        if (e.code === 'auth/user-not-found') {
            errorMessage = "No account found with this email. Please sign up first.";
        } else if (e.code === 'auth/wrong-password') {
            errorMessage = "Incorrect password. Please try again.";
        } else if (e.code === 'auth/invalid-credential') {
            errorMessage = "Invalid email or password.";
        } else if (e.code === 'auth/too-many-requests') {
            errorMessage = "Too many failed attempts. Please try again later or reset your password.";
        } else if (e.code === 'auth/user-disabled') {
            errorMessage = "This account has been disabled.";
        } else {
            errorMessage += e.message;
        }
        
        showMessage(errorMessage, "signInMessage");
    }
});

// Google buttons
document.getElementById("googleSignUpBtn")?.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
        const res = await signInWithPopup(auth, provider);
        if (await handleGoogleSignUp(res.user, "signUpMessage")) {
            window.location.href = "homepage.html";
        }
    } catch (e) {
        console.error("Google sign up error:", e);
        sessionStorage.setItem("socialAuthType", "signup");
        await signInWithRedirect(auth, provider);
    }
});

document.getElementById("googleSignInBtn")?.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
        const res = await signInWithPopup(auth, provider);
        if (await handleGoogleSignIn(res.user, "signInMessage")) {
            window.location.href = "homepage.html";
        }
    } catch (e) {
        console.error("Google sign in error:", e);
        sessionStorage.setItem("socialAuthType", "signin");
        await signInWithRedirect(auth, provider);
    }
});

// Resend verification email
window.resendVerificationEmail = async function() {
    const email = document.getElementById("logEmail")?.value;
    const password = document.getElementById("logPassword")?.value;
    
    if (!email || !password) {
        showMessage("Please enter your email and password first, then click Resend.", "signInMessage");
        return;
    }
    
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        
        if (cred.user.emailVerified) {
            showMessage("Your email is already verified! You can sign in now.", "signInMessage");
            await auth.signOut();
            return;
        }
        
        const actionCodeSettings = {
            url: window.location.origin + '/index.html',
            handleCodeInApp: true
        };
        
        await sendEmailVerification(cred.user, actionCodeSettings);
        
        showMessage(
            `<strong>Verification Email Sent!</strong><br><br>
            Check your inbox at <strong>${email}</strong><br>
            (Don't forget to check spam/junk folder)<br><br>
            Click the link in the email to verify your account.`,
            "signInMessage"
        );
        
        await auth.signOut();
        
    } catch (error) {
        console.error("Resend failed:", error);
        
        let errorMsg = "Failed to resend verification email. ";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            errorMsg = "Incorrect password. Please check your credentials.";
        } else if (error.code === 'auth/too-many-requests') {
            errorMsg = "Too many requests. Please wait a few minutes before trying again.";
        } else {
            errorMsg += error.message;
        }
        
        showMessage(errorMsg, "signInMessage");
    }
};
