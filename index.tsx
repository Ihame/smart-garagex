
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
// Fix: Explicitly separate value and type imports for firebase/app
import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
// Fix: Updated Firebase Auth imports for v9+
// Fix: Explicitly separate value and type imports for firebase/auth
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import type { User, Auth } from "firebase/auth";
// Fix: Updated Firebase Firestore imports for v9+
import { 
  getFirestore,
  type Firestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs, // Added for fetching multiple docs
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  Timestamp,
  where // Added for querying
} from "firebase/firestore";
import { 
  getStorage, 
  FirebaseStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";


// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCLSgkJ7c4fkJ1jHRl3lr-dTginTr0Wiro", // This should be your actual Firebase API key
  authDomain: "smartgarageapp-44f56.firebaseapp.com",
  projectId: "smartgarageapp-44f56",
  storageBucket: "smartgarageapp-44f56.firebasestorage.app",
  messagingSenderId: "944115815591",
  appId: "1:944115815591:web:7867a86f8c21c9ce327782"
};

// Initialize Firebase
const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
const firebaseAuth: Auth = getAuth(firebaseApp);
const db: Firestore = getFirestore(firebaseApp);
const storage: FirebaseStorage = getStorage(firebaseApp);

// --- Gemini API Setup ---
const GEMINI_API_KEY = process.env.API_KEY; // Ensure this is set in your environment
let genAI: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} else {
  console.warn("API_KEY for Gemini is not set. AI features will be limited (chat AI responses disabled).");
}

// !!! IMPORTANT: REPLACE THESE WITH YOUR ACTUAL MECHANIC USER UIDs !!!
const MECHANIC_UIDS = [
  "asxCf9J3c6fB6JNEA5k67EPFFqs2", 
  "Fw1kkBgXTbbblvZte05F1rOQBDo2",
  "REPLACE_WITH_MECHANIC_3_UID",
  "REPLACE_WITH_MECHANIC_4_UID",
  "REPLACE_WITH_MECHANIC_5_UID"
];


// --- SVG Icons (Futuristic Style) ---
const ICONS = {
  logo: `<svg viewBox="0 0 100 100" fill="currentColor" class="logo-svg"><text x="5" y="70" font-family="Arial, sans-serif" font-size="50" font-weight="bold">S</text><text x="45" y="70" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill-opacity="0.7">G</text><rect x="5" y="75" width="80" height="5" /></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  diagnose: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  contact: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
  hamburger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  attach: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
  benefitConvenience: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  benefitTime: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  benefitCost: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  benefitExpert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>`,
  profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  loginKey: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="M15.5 7.5 18 5l-3-3-2.5 2.5"></path></svg>`,
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`
};

interface ChatMessage {
  id: string; // Firestore document ID
  sender: 'user' | 'mechanic' | 'ai'; // 'mechanic' can be system/VA or actual mechanic
  text: string;
  timestamp: Date; // Converted from Firestore Timestamp
  type: 'text' | 'file';
  fileName?: string;
  fileURL?: string; // Download URL for files
  avatar?: string; // Client-side only
  userId?: string; // UID of the sender
}

interface DiagnosisRequest {
    id: string; // Firestore Document ID
    userId: string;
    userName: string;
    userEmail: string | null;
    carModel: string;
    licensePlate: string;
    vin: string;
    carIssue: string;
    carPhotoUrl?: string;
    carPhotoName?: string;
    engineSoundUrl?: string;
    engineSoundName?: string;
    diagnosisMethod: string;
    preferredDiagnosisLanguage: string;
    status: 'submitted' | 'in_progress' | 'awaiting_user_info' | 'parts_ordered' | 'resolved' | 'closed';
    createdAt: Timestamp | null; // Firestore Timestamp, convert to Date on client, can be null if not set
    userLocation: string; // User-provided location
    mechanicNotes?: string;
    recommendedParts?: string;
    suggestedShop?: string;
    proformaURL?: string;
}

const appState = {
  currentView: 'home',
  language: 'en',
  theme: 'light',
  isMobileMenuOpen: false,
  currentUser: null as User | null, 
  isCurrentUserMechanic: false, 
  loginFormMode: 'login' as 'login' | 'signup', 
  authError: null as string | null, 
  currentDiagnosisId: null as string | null, 
  formData: { 
    name: '',
    carModel: '',
    licensePlate: '',
    vin: '',
    carIssue: '',
    carPhoto: null as File | null,
    engineSound: null as File | null,
    diagnosisMethod: 'liveChat',
    preferredDiagnosisLanguage: 'en',
    userLocation: '', 
  },
  chatMessages: [] as ChatMessage[], 
  hasSubmittedDiagnosis: false, 
  chatListenerUnsubscribe: null as (() => void) | null, 
  diagnosisRequestsForMechanic: [] as DiagnosisRequest[], 
  diagnosisRequestsForUser: [] as DiagnosisRequest[], 
  currentMechanicDashboardFilter: 'all' as string, 
  activeDiagnosisForSidebar: null as DiagnosisRequest | null, 
};

const uiStrings = {
  en: {
    smartGarage: 'Smart Garage',
    tagline: "Your Car's Health, Virtually Assessed.",
    requestDiagnosis: '🔧 Diagnose',
    requestDiagnosisTitle: 'Request Virtual Diagnosis',
    name: 'Name',
    namePlaceholder: 'Enter your full name',
    carModel: 'Car Model (Optional)',
    carModelPlaceholder: 'e.g., Toyota Camry 2020',
    licensePlate: 'License Plate (Optional)',
    licensePlatePlaceholder: 'e.g., ABC 123',
    vin: 'VIN (Optional)',
    vinPlaceholder: 'Enter 17-digit VIN',
    carIssue: 'Describe the Car Issue',
    carIssuePlaceholder: 'e.g., Engine makes a strange noise...',
    uploadCarPhoto: 'Upload Car Photo (Optional)',
    uploadEngineSound: 'Upload Engine Sound (Optional)',
    preferredDiagnosisMethod: 'Preferred Diagnosis Method',
    liveChat: 'Live Chat',
    videoCall: 'Video Call',
    photoAudioOnly: 'Photo/Audio Only',
    preferredDiagnosisLanguage: 'Preferred Language for Diagnosis',
    english: 'English',
    kinyarwanda: 'Kinyarwanda',
    submitRequest: 'Submit Diagnosis Request',
    backToHome: 'Back to Home',
    chatScreenTitle: 'Diagnosis Chat',
    chatPlaceholder: 'Loading chat messages... Send a message to start!', 
    themeToggle: 'Toggle Theme',
    languageToggle: 'EN/RW',
    footerText: `© ${new Date().getFullYear()} Smart Garage. All rights reserved.`,
    garageHeroAlt: 'Abstract futuristic car interface or schematic',
    selectLanguage: 'Select Language',
    selectTheme: 'Select Theme',
    formSubmissionSuccess: 'Diagnosis request submitted! Starting chat...',
    navHome: 'Home',
    navRequestDiagnosis: 'Diagnose',
    navLiveChat: 'Chat',
    navContactUs: 'Contact',
    navLogin: 'Login',
    navProfile: 'Profile',
    navMechanicDashboard: 'Mechanic HQ',
    loginTitle: 'Owner Access Portal',
    loginNameLabel: 'Enter Your Name or ID', 
    loginButton: 'Login', 
    profileTitle: 'User Profile',
    myCar: 'My Car', 
    logout: 'Logout',
    noCarInfo: 'No car information submitted yet.', 
    contactUsTitle: 'Contact Us',
    typeMessagePlaceholder: 'Type your message...',
    sendMessage: 'Send',
    attachFile: 'Attach File',
    typingIndicator: 'is typing...', // Kept for potential future manual use by mechanics
    aiAssistant: 'AI Assistant', // Persona name, though AI responses removed
    mechanic: 'Virtual Assistant', // System messages, or actual mechanic
    user: 'You',
    diagnosisSummary: 'Diagnosis Summary',
    submittedInformation: 'Submitted Information',
    mechanicNotes: 'Mechanic Notes',
    recommendedParts: 'Recommended Parts',
    suggestedShop: 'Suggested Shop',
    proformaURL: 'Proforma/Invoice URL',
    assignedMechanic: 'Assigned Mechanic',
    contactFormMessage: 'Your Message',
    contactFormMessagePlaceholder: 'Write your message here...',
    submitMessage: 'Send Message',
    messageSentSuccess: 'Your message has been sent successfully!',
    contactInfo: 'Contact Information',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    placeholderPhone: '+1 (555) 123-4567',
    placeholderEmail: 'support@smartgarage.com',
    placeholderAddress: '123 Auto Lane, Mechanicville, USA',
    benefitConvenienceTitle: 'Convenient',
    benefitConvenienceDesc: 'Expert advice from home.',
    benefitTimeTitle: 'Time-Saving',
    benefitTimeDesc: 'No initial travel to the garage.',
    benefitCostTitle: 'Cost-Effective',
    benefitCostDesc: 'Resolve minor issues or get quotes faster.',
    benefitExpertTitle: 'Expert Mechanics',
    benefitExpertDesc: 'Connect with certified professionals.',
    whyVirtualDiagnosis: 'Why Choose Virtual Diagnosis?',
    menuOpen: 'Open Menu',
    menuClose: 'Close Menu',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm Password',
    signUpLink: 'Create an account',
    loginLink: 'Already have an account? Login',
    createAccountButton: 'Create Account',
    authError: 'Authentication Error',
    authLoginError: 'Login failed. Please check your email and password.',
    authSignUpError: 'Sign up failed. The email might be in use or password too weak.',
    authDefaultError: 'An unexpected error occurred. Please try again.',
    displayNameLabel: 'Display Name (Optional)',
    displayNamePlaceholder: 'Your preferred name',
    chatAskLocation: "Hello %s! I'm the Virtual Assistant for your %s. To help connect you with the best local mechanic if needed, could you please share your general location (e.g., city or region)?",
    chatLocationThanks: "Thank you! We've noted your location: %s. A certified mechanic has been notified about your car issue: \"%s\". They will join the chat shortly if available, or review this information soon. You can continue to add messages or files here.",
    chatVehicle: "vehicle",
    uploadingFile: "Uploading file...",
    fileUploaded: "File uploaded: %s",
    errorNoDiagnosisChat: "No active diagnosis chat found. Please submit a new diagnosis request, or select one from the dashboard.",
    mechanicDashboardTitle: "Mechanic Dashboard",
    viewChat: "View/Chat",
    noDiagnosisRequests: "No diagnosis requests found.",
    filterByStatus: "Filter by status:",
    allStatuses: "All Statuses",
    statusSubmitted: "Submitted",
    statusInProgress: "In Progress",
    statusAwaitingUserInfo: "Awaiting User Info",
    statusPartsOrdered: "Parts Ordered",
    statusResolved: "Resolved",
    statusClosed: "Closed",
    updateStatus: "Update Status:",
    saveNotes: "Save Notes/Suggestions",
    diagnosisHistory: "My Diagnosis Requests",
    statusLabel: "Status",
    createdAtLabel: "Submitted",
    errorSavingMechanicUpdates: "Error saving updates. Please try again.",
    updatesSavedSuccess: "Updates saved successfully!",
    notAvailable: "N/A",
  },
  rw: {
    smartGarage: 'Igaraji Igezweho',
    tagline: 'Ubuzima bw’Imodoka Yawe, Bupimwe Online.',
    requestDiagnosis: '🔧 Pima',
    requestDiagnosisTitle: 'Saba Ubufasha bwa Diagnosis',
    name: 'Amazina yose',
    namePlaceholder: 'Andika amazina yawe yose',
    carModel: 'Ubwoko bw’imodoka (Si ngombwa)',
    carModelPlaceholder: 'Urugero, Toyota Camry 2020',
    licensePlate: 'Numero y’Imodoka (Plaque) (Si ngombwa)',
    licensePlatePlaceholder: 'Urugero, ABC 123',
    vin: 'VIN (Si ngombwa)',
    vinPlaceholder: 'Andika VIN igizwe n’imibare 17',
    carIssue: 'Sobanura Ikibazo cy’Imodoka',
    carIssuePlaceholder: 'Urugero, Moteri irimo urusaku...',
    uploadCarPhoto: 'Ohereza Ifoto y’Imodoka (Si ngombwa)',
    uploadEngineSound: 'Ohereza Amajwi ya Moteri (Si ngombwa)',
    preferredDiagnosisMethod: 'Uburyo wifuza gukoresha muri Diagnosis',
    liveChat: 'Ikiganiro Cyimbitse',
    videoCall: 'Guhamagarana Kuri Video',
    photoAudioOnly: 'Ifoto/Amajwi Gusa',
    preferredDiagnosisLanguage: 'Ururimi rwifashishwa muri Diagnosis',
    english: 'Icyongereza',
    kinyarwanda: 'Ikinyarwanda',
    submitRequest: 'Emeza Ubusabe',
    backToHome: 'Subira Ahabanza',
    chatScreenTitle: 'Ikiganiro cya Diagnosis',
    chatPlaceholder: 'Turimo gushaka ubutumwa... Kohereza ubutumwa bwa mbere kugirango utangire!',
    themeToggle: 'Hindura Umucyo/Umwijima',
    languageToggle: 'EN/RW',
    footerText: `© ${new Date().getFullYear()} Igaraji Igezweho. Uburenganzira bwose burubahirizwa.`,
    garageHeroAlt: 'Igishushanyo cy\'igaraji cyangwa imodoka ya none',
    selectLanguage: 'Hitamo Ururimi',
    selectTheme: 'Hitamo Umucyo/Umwijima',
    formSubmissionSuccess: 'Ubusabe bwawe bwoherejwe neza! Dutangiye ikiganiro...',
    navHome: 'Ahabanza', 
    navRequestDiagnosis: 'Pima',
    navLiveChat: 'Ikiganiro',
    navContactUs: 'Twandikire',
    navLogin: 'Injira',
    navProfile: 'Porofayili',
    navMechanicDashboard: 'Aho Abakanishi Bakorera',
    loginTitle: 'Umuryango w\'Abanyemari', 
    loginNameLabel: 'Andika Izina ryawe cyangwa Indangamuntu', 
    loginButton: 'Injira', 
    profileTitle: 'Porofayili Yanjye',
    myCar: 'Imodoka Yanjye',
    logout: 'Sohoka',
    noCarInfo: 'Nta makuru y\'imodoka aratangwa.',
    contactUsTitle: 'Twandikire',
    typeMessagePlaceholder: 'Andika ubutumwa bwawe...',
    sendMessage: 'Ohereza',
    attachFile: 'Ongeraho Idosiye',
    typingIndicator: 'ari kwandika...',
    aiAssistant: 'Ubufasha bwa AI',
    mechanic: 'Umuhuzabikorwa wa Virutuwale',
    user: 'Wowe',
    diagnosisSummary: 'Incamake ya Diagnosis',
    submittedInformation: 'Amakuru Watumye',
    mechanicNotes: 'Inyandiko z\'Umu Fundi',
    recommendedParts: 'Ibice Byasabwe',
    suggestedShop: 'Iduka Ryasabwe',
    proformaURL: 'URL ya Proforma/Fagitire',
    assignedMechanic: 'Umu Fundi Washinzwe',
    contactFormMessage: 'Ubutumwa Bwawe',
    contactFormMessagePlaceholder: 'Andika ubutumwa bwawe hano...',
    submitMessage: 'Ohereza Ubutumwa',
    messageSentSuccess: 'Ubutumwa bwawe bwoherejwe neza!',
    contactInfo: 'Amakuru yo Kutwandikira',
    phone: 'Telefone',
    email: 'Imeyili',
    address: 'Aderesi',
    placeholderPhone: '+250 7XX XXX XXX',
    placeholderEmail: 'info@igarajiigezweho.rw',
    placeholderAddress: 'KN 1 Rd, Kigali, Rwanda',
    benefitConvenienceTitle: 'Byoroshye',
    benefitConvenienceDesc: 'Inama z\'inzobere utavuye murugo.',
    benefitTimeTitle: 'Wunguka Igihe',
    benefitTimeDesc: 'Nta ngendo ujya ku igaraji.',
    benefitCostTitle: 'Uhendukirwa',
    benefitCostDesc: 'Kemura ibibazo bito cyangwa ubone ibiciro byihuse.',
    benefitExpertTitle: 'Abatekinisiye b\'Inzobere',
    benefitExpertDesc: 'Vugana n\'abahanga babyemerewe.',
    whyVirtualDiagnosis: 'Kuki Wahitamo Diagnosis ya Kure?',
    menuOpen: 'Fungura Urutonde',
    menuClose: 'Funga Urutonde',
    emailLabel: 'Imeri',
    passwordLabel: 'Ijambobanga',
    confirmPasswordLabel: 'Emeza Ijambobanga',
    signUpLink: 'Fungura konti nshya',
    loginLink: 'Usanganywe konti? Injira',
    createAccountButton: 'Fungura Konti',
    authError: 'Amakosa kuri seriveri',
    authLoginError: 'Kwinjira byanze. Reba imeri n\'ijambobanga.',
    authSignUpError: 'Kwiyandikisha byanze. Imeri ishobora kuba ikoreshwa cyangwa ijambobanga ridakomeye.',
    authDefaultError: 'Habaye ikibazo kitateguwe. Ongera ugerageze.',
    displayNameLabel: 'Izina Ryakugaragaza (Si ngombwa)',
    displayNamePlaceholder: 'Izina ukunda',
    chatAskLocation: "Muraho %s! Ndi Umuhuzabikorwa wa Virutuwale ku %s yawe. Kugira ngo tugufashe kubona umukanishi mwiza wo hafi yawe bibaye ngombwa, watubwira umujyi cyangwa akarere uherereyemo?",
    chatLocationThanks: "Murakoze! Twakiriye aho muherereye: %s. Umu fundi wabigize umwuga yamenyeshejwe ikibazo cy'imodoka yawe: \"%s\". Araza mu kanya mu kiganiro niba aboneka, cyangwa arebe aya makuru vuba. Wakomeza kongeramo ubutumwa cyangwa amadosiye hano.",
    chatVehicle: "ikinyabiziga",
    uploadingFile: "Kohereza idosiye...",
    fileUploaded: "Idosiye yoherejwe: %s",
    errorNoDiagnosisChat: "Nta kiganiro cya diyagnostike gihari. Saba ubufasha bundi bushya, cyangwa hitamo kimwe mu byo ku rutonde rw'abakanishi.",
    mechanicDashboardTitle: "Aho Abakanishi Bakorera",
    viewChat: "Reba/Gana",
    noDiagnosisRequests: "Nta busabe bwa diyagnostike buhari.",
    filterByStatus: "Hondora ukurikije uko bihagaze:",
    allStatuses: "Byose",
    statusSubmitted: "Byaroherejwe",
    statusInProgress: "Birimo gukorwa",
    statusAwaitingUserInfo: "Hategerejwe amakuru y'umukiriya",
    statusPartsOrdered: "Ibikoresho byatumijwe",
    statusResolved: "Byakemutse",
    statusClosed: "Byarangiye",
    updateStatus: "Hindura uko bihagaze:",
    saveNotes: "Bika Inyandiko/Ibyifuzo",
    diagnosisHistory: "Amateka ya Diyagnostike Zanjye",
    statusLabel: "Uko Bihagaze",
    createdAtLabel: "Byoherejwe",
    errorSavingMechanicUpdates: "Habaye ikosa mu kubika impinduka. Ongera ugerageze.",
    updatesSavedSuccess: "Impinduka zabitswe neza!",
    notAvailable: "Ntabwo bihari",
  },
};

// Helper function for string formatting
function formatString(str: string, ...args: string[]): string {
  return str.replace(/%s/g, () => args.shift() || '');
}

function t(key: keyof typeof uiStrings.en, ...args: string[]): string {
  const selectedLanguage = appState.language as keyof typeof uiStrings;
  const message = uiStrings[selectedLanguage]?.[key] || uiStrings.en[key];
  if (args.length > 0 && typeof message === 'string') {
    return formatString(message, ...args);
  }
  return message || key;
}


let appContainer: HTMLElement | null = null;
let appHeader: HTMLElement | null = null;
let appMain: HTMLElement | null = null;
let appFooter: HTMLElement | null = null;

function renderHeader() {
  if (!appHeader) return;

  let navItems: { view: string; label: string; icon: string }[] = [];

  if (appState.isCurrentUserMechanic) {
    navItems.push({ view: 'mechanicDashboard', label: t('navMechanicDashboard'), icon: ICONS.dashboard });
    navItems.push({ view: 'chat', label: t('navLiveChat'), icon: ICONS.chat });
    navItems.push({ view: 'profile', label: t('navProfile'), icon: ICONS.profile });
    navItems.push({ view: 'contactUs', label: t('navContactUs'), icon: ICONS.contact });
  } else {
    navItems.push({ view: 'home', label: t('navHome'), icon: ICONS.home });
    navItems.push({ view: 'diagnosisForm', label: t('navRequestDiagnosis'), icon: ICONS.diagnose });

    if (appState.currentUser) { 
      if (appState.currentDiagnosisId || appState.hasSubmittedDiagnosis) {
        navItems.push({ view: 'chat', label: t('navLiveChat'), icon: ICONS.chat });
      }
      navItems.push({ view: 'profile', label: t('navProfile'), icon: ICONS.profile });
    }
    
    navItems.push({ view: 'contactUs', label: t('navContactUs'), icon: ICONS.contact });

    if (!appState.currentUser) { 
      navItems.push({ view: 'login', label: t('navLogin'), icon: ICONS.loginKey });
    }
  }

  const navLinksHtml = navItems.map(item => `
    <a href="#" data-view="${item.view}" class="nav-link ${appState.currentView === item.view ? 'active' : ''}" aria-current="${appState.currentView === item.view ? 'page' : 'false'}">
      <span class="nav-icon" aria-hidden="true">${item.icon}</span>
      <span class="nav-text">${item.label}</span>
    </a>
  `).join('');

  appHeader.innerHTML = `
    <div class="logo-container">
      <a href="#" data-view="${appState.isCurrentUserMechanic ? 'mechanicDashboard' : 'home'}" aria-label="${t('smartGarage')} - ${appState.isCurrentUserMechanic ? t('navMechanicDashboard') : t('navHome')}">
        <span class="logo-svg-wrapper">${ICONS.logo}</span>
        <span class="logo-text">${t('smartGarage')}</span>
      </a>
    </div>
    <nav id="main-nav" class="${appState.isMobileMenuOpen ? 'open' : ''}" aria-label="Main navigation">
      <button id="close-menu-btn" class="icon-button mobile-only" aria-label="${t('menuClose')}">${ICONS.close}</button>
      ${navLinksHtml}
    </nav>
    <div class="controls">
      <button id="language-toggle" class="control-button" aria-label="${t('selectLanguage')}">${appState.language.toUpperCase()}</button>
      <button id="theme-toggle" class="icon-button control-button" aria-label="${t('selectTheme')}">${appState.theme === 'light' ? ICONS.moon : ICONS.sun}</button>
      <button id="hamburger-menu-btn" class="icon-button mobile-only" aria-label="${t('menuOpen')}" aria-expanded="${appState.isMobileMenuOpen}">${ICONS.hamburger}</button>
    </div>
  `;

  document.querySelector('.logo-container a')?.addEventListener('click', (e) => {
    e.preventDefault();
    appState.currentView = appState.isCurrentUserMechanic ? 'mechanicDashboard' : 'home';
    appState.isMobileMenuOpen = false;
    renderApp();
  });

  document.getElementById('language-toggle')?.addEventListener('click', toggleLanguage);
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  
  const hamburgerBtn = document.getElementById('hamburger-menu-btn');
  const closeMenuBtn = document.getElementById('close-menu-btn');
  const mainNav = document.getElementById('main-nav');

  hamburgerBtn?.addEventListener('click', () => {
    appState.isMobileMenuOpen = true;
    mainNav?.classList.add('open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    renderApp(); 
  });
  closeMenuBtn?.addEventListener('click', () => {
    appState.isMobileMenuOpen = false;
    mainNav?.classList.remove('open');
    hamburgerBtn?.setAttribute('aria-expanded', 'false');
    renderApp(); 
  });
  
  appHeader.querySelectorAll('nav a.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetLink = (e.currentTarget as HTMLElement);
      const view = targetLink.dataset.view;
      if (view) {
        if (appState.currentView === 'chat' && view !== 'chat' && appState.chatListenerUnsubscribe && !appState.isCurrentUserMechanic) {
            appState.chatListenerUnsubscribe();
            appState.chatListenerUnsubscribe = null;
        }

        let targetView = view;
        if (view === 'chat') {
          if (appState.isCurrentUserMechanic && !appState.currentDiagnosisId) {
            // Mechanic clicked general chat link, but no specific diagnosis is active.
            // Redirect to dashboard. renderChatPage's guard will also do this,
            // but setting it here avoids a potential flicker/unnecessary render step.
            targetView = 'mechanicDashboard';
            // console.info("Mechanic trying to access chat without active diagnosis. Redirecting to dashboard.");
            // alert(t('errorNoDiagnosisChat')); // Optional: inform user, can be noisy
          } else if (!appState.isCurrentUserMechanic && !appState.currentDiagnosisId && !appState.hasSubmittedDiagnosis) {
            // Regular user trying to access chat without a submission/ID
            targetView = 'diagnosisForm';
          }
        }
        appState.currentView = targetView;
        appState.isMobileMenuOpen = false; 
        hamburgerBtn?.setAttribute('aria-expanded', 'false');
        renderApp();
      }
    });
  });
}

function renderFooter() {
  if (!appFooter) return;
  appFooter.innerHTML = `<p>${t('footerText')}</p>`;
}

function renderHomePage() {
  if (!appMain) return;
  appMain.innerHTML = `
    <div class="home-page">
      <section class="hero">
        <div class="hero-content">
          <h1>${t('smartGarage')}</h1>
          <p>${t('tagline')}</p>
          <button id="request-diagnosis-btn-home" class="cta-button">
            <span class="btn-icon" aria-hidden="true">${ICONS.diagnose}</span>
            ${t('requestDiagnosisTitle')}
          </button>
        </div>
        <div class="hero-visual-container" aria-label="${t('garageHeroAlt')}">
        </div>
      </section>
      <section class="benefits">
        <h2>${t('whyVirtualDiagnosis')}</h2>
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon" aria-hidden="true">${ICONS.benefitConvenience}</div>
            <h3>${t('benefitConvenienceTitle')}</h3>
            <p>${t('benefitConvenienceDesc')}</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon" aria-hidden="true">${ICONS.benefitTime}</div>
            <h3>${t('benefitTimeTitle')}</h3>
            <p>${t('benefitTimeDesc')}</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon" aria-hidden="true">${ICONS.benefitCost}</div>
            <h3>${t('benefitCostTitle')}</h3>
            <p>${t('benefitCostDesc')}</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon" aria-hidden="true">${ICONS.benefitExpert}</div>
            <h3>${t('benefitExpertTitle')}</h3>
            <p>${t('benefitExpertDesc')}</p>
          </div>
        </div>
      </section>
    </div>
  `;
  document.getElementById('request-diagnosis-btn-home')?.addEventListener('click', () => {
    appState.currentView = 'diagnosisForm';
    renderApp();
  });
}

function renderLoginPage() {
    if (!appMain) return;
    const isLoginMode = appState.loginFormMode === 'login';

    appMain.innerHTML = `
        <div class="login-page">
            <div class="login-form-container">
                <h2>${isLoginMode ? t('navLogin') : t('signUpLink')}</h2>
                <form id="auth-form" aria-labelledby="auth-form-title">
                    <h2 id="auth-form-title" class="sr-only">${isLoginMode ? t('navLogin') : t('signUpLink')}</h2>
                    <div id="auth-error-message" class="form-error" role="alert" style="${appState.authError ? '' : 'display: none;'}">${appState.authError}</div>
                    
                    ${!isLoginMode ? `
                    <div class="form-group">
                        <label for="displayName">${t('displayNameLabel')}</label>
                        <input type="text" id="displayName" name="displayName" placeholder="${t('displayNamePlaceholder')}">
                    </div>
                    ` : ''}
                    <div class="form-group">
                        <label for="email">${t('emailLabel')}</label>
                        <input type="email" id="email" name="email" placeholder="${t('placeholderEmail')}" required autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label for="password">${t('passwordLabel')}</label>
                        <input type="password" id="password" name="password" placeholder="${t('passwordLabel')}" required ${isLoginMode ? 'autocomplete="current-password"' : 'autocomplete="new-password" minlength="6"'}>
                    </div>
                    ${!isLoginMode ? `
                    <div class="form-group">
                        <label for="confirmPassword">${t('confirmPasswordLabel')}</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" placeholder="${t('confirmPasswordLabel')}" required autocomplete="new-password" minlength="6">
                    </div>
                    ` : ''}
                    <button type="submit" class="btn btn-primary btn-full-width">
                        ${isLoginMode ? t('loginButton') : t('createAccountButton')}
                    </button>
                </form>
                <p class="auth-toggle-link">
                    <a href="#" id="auth-mode-toggle">
                        ${isLoginMode ? t('signUpLink') : t('loginLink')}
                    </a>
                </p>
            </div>
        </div>
    `;
    document.getElementById('auth-form')?.addEventListener('submit', isLoginMode ? handleLogin : handleSignUp);
    document.getElementById('auth-mode-toggle')?.addEventListener('click', (e) => {
        e.preventDefault();
        appState.loginFormMode = isLoginMode ? 'signup' : 'login';
        appState.authError = null; 
        renderApp();
    });
}

async function renderProfilePage() {
    if (!appMain || !appState.currentUser) {
        appState.currentView = 'login';
        renderApp();
        return;
    }

    const user = appState.currentUser;
    const userName = user.displayName || user.email || t('user');
    const userEmail = user.email || 'N/A';

    await fetchUserDiagnosisHistory(); 

    const diagnosisHistoryHtml = appState.diagnosisRequestsForUser.length > 0
        ? `<ul class="diagnosis-history-list">
            ${appState.diagnosisRequestsForUser.map(req => `
              <li class="diagnosis-history-item">
                <div class="history-item-summary">
                  <span class="history-item-model">${req.carModel || 'Vehicle'} - ${req.carIssue.substring(0,30)}...</span>
                  <span class="history-item-status status-${req.status}">${t(`status${req.status.charAt(0).toUpperCase() + req.status.slice(1)}` as keyof typeof uiStrings.en) || req.status}</span>
                </div>
                <div class="history-item-details">
                  <p><strong>${t('createdAtLabel')}:</strong> ${req.createdAt && req.createdAt.toDate ? req.createdAt.toDate().toLocaleDateString() : t('notAvailable')}</p>
                  ${appState.activeDiagnosisForSidebar?.id === req.id && appState.activeDiagnosisForSidebar?.mechanicNotes ? `<p><strong>${t('mechanicNotes')}:</strong> ${appState.activeDiagnosisForSidebar.mechanicNotes}</p>` : ''}
                  <button class="btn btn-secondary btn-small view-chat-history-btn" data-diagnosis-id="${req.id}" ${req.status === 'closed' || req.status === 'resolved' ? 'disabled' : ''}>
                    ${t('viewChat')}
                  </button>
                </div>
              </li>
            `).join('')}
           </ul>`
        : `<p>${t('noCarInfo')}</p>`;

    appMain.innerHTML = `
        <div class="profile-page">
            <h2>${t('profileTitle')}</h2>
            <div class="profile-card">
                <div class="profile-avatar-large" aria-hidden="true">${ICONS.profile}</div>
                <h3 class="profile-name">${userName}</h3>
                <div class="profile-details">
                    <div class="profile-detail-item">
                        <span class="detail-label">${t('emailLabel')}:</span>
                        <span class="detail-value">${userEmail}</span>
                    </div>
                </div>
                <button id="logout-btn" class="btn btn-secondary btn-full-width">${t('logout')}</button>
            </div>
            <div class="profile-section">
                <h3>${t('diagnosisHistory')}</h3>
                <div id="diagnosis-history-list-container">
                    ${diagnosisHistoryHtml}
                </div>
            </div>
        </div>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.querySelectorAll('.view-chat-history-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const diagnosisId = (e.currentTarget as HTMLElement).dataset.diagnosisId;
            if (diagnosisId) {
                appState.currentDiagnosisId = diagnosisId;
                appState.hasSubmittedDiagnosis = true; 
                const selectedRequest = appState.diagnosisRequestsForUser.find(r => r.id === diagnosisId);
                appState.activeDiagnosisForSidebar = selectedRequest || null;
                appState.currentView = 'chat';
                renderApp();
            }
        });
    });
}


function renderDiagnosisFormPage() {
  if (!appMain) return;
  
  const prefillName = appState.currentUser ? (appState.currentUser.displayName || appState.currentUser.email || '') : appState.formData.name;

  appMain.innerHTML = `
    <div class="diagnosis-form-page">
      <h2>${t('requestDiagnosisTitle')}</h2>
      <form id="diagnosis-form" aria-labelledby="diagnosis-form-title-h2">
        <h2 id="diagnosis-form-title-h2" class="sr-only">${t('requestDiagnosisTitle')}</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="name">${t('name')}</label>
            <input type="text" id="name" name="name" placeholder="${t('namePlaceholder')}" value="${prefillName}" required autocomplete="name">
          </div>
          <div class="form-group">
            <label for="carModel">${t('carModel')}</label>
            <input type="text" id="carModel" name="carModel" placeholder="${t('carModelPlaceholder')}" value="${appState.formData.carModel}" autocomplete="on">
          </div>
          <div class="form-group">
            <label for="licensePlate">${t('licensePlate')}</label>
            <input type="text" id="licensePlate" name="licensePlate" placeholder="${t('licensePlatePlaceholder')}" value="${appState.formData.licensePlate}" autocomplete="on">
          </div>
          <div class="form-group">
            <label for="vin">${t('vin')}</label>
            <input type="text" id="vin" name="vin" placeholder="${t('vinPlaceholder')}" value="${appState.formData.vin}" minlength="17" maxlength="17" autocomplete="on">
          </div>
          <div class="form-group form-group-full-width">
            <label for="carIssue">${t('carIssue')}</label>
            <textarea id="carIssue" name="carIssue" rows="4" placeholder="${t('carIssuePlaceholder')}" required>${appState.formData.carIssue}</textarea>
          </div>
          <div class="form-group">
            <label for="carPhoto">${t('uploadCarPhoto')}</label>
            <input type="file" id="carPhoto" name="carPhoto" accept="image/*">
          </div>
          <div class="form-group">
            <label for="engineSound">${t('uploadEngineSound')}</label>
            <input type="file" id="engineSound" name="engineSound" accept="audio/*,video/*">
          </div>
        </div>
        <fieldset class="form-group">
          <legend>${t('preferredDiagnosisMethod')}</legend>
          <div class="radio-group">
            <label><input type="radio" name="diagnosisMethod" value="liveChat" ${appState.formData.diagnosisMethod === 'liveChat' ? 'checked' : ''}> ${t('liveChat')}</label>
            <label><input type="radio" name="diagnosisMethod" value="videoCall" ${appState.formData.diagnosisMethod === 'videoCall' ? 'checked' : ''}> ${t('videoCall')}</label>
            <label><input type="radio" name="diagnosisMethod" value="photoAudioOnly" ${appState.formData.diagnosisMethod === 'photoAudioOnly' ? 'checked' : ''}> ${t('photoAudioOnly')}</label>
          </div>
        </fieldset>
        <div class="form-group">
          <label for="preferredDiagnosisLanguage">${t('preferredDiagnosisLanguage')}</label>
          <select id="preferredDiagnosisLanguage" name="preferredDiagnosisLanguage">
            <option value="en" ${appState.formData.preferredDiagnosisLanguage === 'en' ? 'selected' : ''}>${t('english')}</option>
            <option value="rw" ${appState.formData.preferredDiagnosisLanguage === 'rw' ? 'selected' : ''}>${t('kinyarwanda')}</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" id="back-to-home-btn-form" class="btn btn-secondary">${t('backToHome')}</button>
          <button type="submit" class="btn btn-primary">${t('submitRequest')}</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('back-to-home-btn-form')?.addEventListener('click', () => {
    appState.currentView = 'home';
    renderApp();
  });

  document.getElementById('diagnosis-form')?.addEventListener('submit', handleFormSubmit);
}

async function renderChatPage() {
  if (!appMain) return;

  if (!appState.currentUser || !appState.currentDiagnosisId) {
    console.warn(t('errorNoDiagnosisChat') + " Current Diagnosis ID:", appState.currentDiagnosisId, "User:", appState.currentUser);
    appState.currentView = appState.isCurrentUserMechanic ? 'mechanicDashboard' : 'diagnosisForm'; 
    renderApp();
    return;
  }
  
  // Setup listener only if not already active for this diagnosisId or if it's null
  if (!appState.chatListenerUnsubscribe || appState.activeDiagnosisForSidebar?.id !== appState.currentDiagnosisId) {
      setupChatListener(); 
  }
  await fetchActiveDiagnosisDetailsForSidebar(); 

  const messagesHtml = appState.chatMessages.map(msg => {
    const senderName = msg.sender === 'user' ? t('user') : (msg.sender === 'ai' ? t('aiAssistant') : t('mechanic'));
    const avatar = msg.sender === 'user' ? '🧑' : (msg.sender === 'ai' ? '🤖' : (msg.userId === 'virtual_mechanic_system' ? '🛠️' : '👨‍🔧')); // Differentiate system VA from actual mechanic
    let messageContentHtml = msg.text;
    if (msg.type === 'file') {
      if (msg.fileURL) {
        messageContentHtml = `<a href="${msg.fileURL}" target="_blank" rel="noopener noreferrer" class="file-attachment-link">📎 ${msg.fileName}</a>`;
      } else {
        messageContentHtml = `<span class="file-attachment-info">📎 ${msg.fileName} (uploading...)</span>`;
      }
    }

    return `
      <div class="message-bubble ${msg.sender}" id="msg-${msg.id}">
        <div class="message-avatar" aria-hidden="true">${avatar}</div>
        <div class="message-content">
          <div class="message-sender">${senderName}</div>
          <div class="message-text">${messageContentHtml}</div>
          <div class="message-timestamp">${msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    `;
  }).join('');
  
  const sidebarData = appState.activeDiagnosisForSidebar;
  const isMechanic = appState.isCurrentUserMechanic;

  const mechanicSidebarControlsHtml = isMechanic && sidebarData ? `
    <div class="summary-section mechanic-controls">
        <h4>${t('updateStatus')}</h4>
        <select id="mechanic-status-select" class="form-control">
            <option value="submitted" ${sidebarData.status === 'submitted' ? 'selected' : ''}>${t('statusSubmitted')}</option>
            <option value="in_progress" ${sidebarData.status === 'in_progress' ? 'selected' : ''}>${t('statusInProgress')}</option>
            <option value="awaiting_user_info" ${sidebarData.status === 'awaiting_user_info' ? 'selected' : ''}>${t('statusAwaitingUserInfo')}</option>
            <option value="parts_ordered" ${sidebarData.status === 'parts_ordered' ? 'selected' : ''}>${t('statusPartsOrdered')}</option>
            <option value="resolved" ${sidebarData.status === 'resolved' ? 'selected' : ''}>${t('statusResolved')}</option>
            <option value="closed" ${sidebarData.status === 'closed' ? 'selected' : ''}>${t('statusClosed')}</option>
        </select>
    </div>
    <div class="summary-section mechanic-controls">
        <h4>${t('mechanicNotes')}</h4>
        <textarea id="mechanic-notes-input" class="form-control" rows="3" placeholder="Enter notes...">${sidebarData.mechanicNotes || ''}</textarea>
    </div>
    <div class="summary-section mechanic-controls">
        <h4>${t('recommendedParts')}</h4>
        <input type="text" id="recommended-parts-input" class="form-control" placeholder="e.g., Spark Plugs, Air Filter" value="${sidebarData.recommendedParts || ''}">
    </div>
    <div class="summary-section mechanic-controls">
        <h4>${t('suggestedShop')}</h4>
        <input type="text" id="suggested-shop-input" class="form-control" placeholder="e.g., AutoCare Center Main St." value="${sidebarData.suggestedShop || ''}">
    </div>
    <div class="summary-section mechanic-controls">
        <h4>${t('proformaURL')}</h4>
        <input type="url" id="proforma-url-input" class="form-control" placeholder="https://link.to/proforma.pdf" value="${sidebarData.proformaURL || ''}">
    </div>
    <button id="save-mechanic-updates-btn" class="btn btn-primary btn-small">${t('saveNotes')}</button>
  ` : '';


  appMain.innerHTML = `
    <div class="chat-page-container">
      <div class="chat-area">
        <h2 class="chat-title">${t('chatScreenTitle')} <span class="chat-id-display">(#${appState.currentDiagnosisId?.substring(0,6) || 'N/A'})</span></h2>
        <div class="chat-messages-area" id="chat-messages-area" aria-live="polite" aria-atomic="false">
          ${appState.chatMessages.length === 0 ? `<p class="chat-placeholder">${t('chatPlaceholder')}</p>` : messagesHtml}
        </div>
        <div class="chat-input-area">
          <label for="chat-message-input" class="sr-only">${t('typeMessagePlaceholder')}</label>
          <textarea id="chat-message-input" placeholder="${t('typeMessagePlaceholder')}"></textarea>
          <input type="file" id="chat-file-input" style="display: none;" accept="image/*,audio/*,video/*" aria-label="${t('attachFile')}">
          <button id="attach-file-btn" class="icon-button" aria-label="${t('attachFile')}">${ICONS.attach}</button>
          <button id="send-chat-message-btn" class="icon-button btn-primary" aria-label="${t('sendMessage')}">${ICONS.send}</button>
        </div>
      </div>
      <aside class="chat-sidebar" aria-label="${t('diagnosisSummary')}">
        <h3>${t('diagnosisSummary')}</h3>
        <div class="summary-section">
          <h4>${t('submittedInformation')}</h4>
          <p><strong>${t('name')}:</strong> ${sidebarData?.userName || 'N/A'}</p>
          <p><strong>${t('carModel')}:</strong> ${sidebarData?.carModel || 'N/A'}</p>
          <p><strong>${t('licensePlate')}:</strong> ${sidebarData?.licensePlate || 'N/A'}</p>
          <p><strong>${t('vin')}:</strong> ${sidebarData?.vin || 'N/A'}</p>
          <p><strong>${t('carIssue')}:</strong> ${sidebarData?.carIssue || 'N/A'}</p>
          ${sidebarData?.carPhotoName ? `<p><strong>Car Photo:</strong> <a href="${sidebarData.carPhotoUrl}" target="_blank" class="file-attachment-link">${sidebarData.carPhotoName}</a></p>` : ''}
          ${sidebarData?.engineSoundName ? `<p><strong>Engine Sound:</strong> <a href="${sidebarData.engineSoundUrl}" target="_blank" class="file-attachment-link">${sidebarData.engineSoundName}</a></p>` : ''}
          <p><strong>Location:</strong> ${sidebarData?.userLocation || 'N/A'}</p>
          <p><strong>Status:</strong> <span class="status-${sidebarData?.status || 'unknown'}">${t(`status${(sidebarData?.status || 'unknown').charAt(0).toUpperCase() + (sidebarData?.status || 'unknown').slice(1)}` as keyof typeof uiStrings.en) || sidebarData?.status}</span></p>
        </div>
        ${!isMechanic && sidebarData?.mechanicNotes ? `<div class="summary-section"><p><strong>${t('mechanicNotes')}:</strong> ${sidebarData.mechanicNotes}</p></div>` : ''}
        ${!isMechanic && sidebarData?.recommendedParts ? `<div class="summary-section"><p><strong>${t('recommendedParts')}:</strong> ${sidebarData.recommendedParts}</p></div>` : ''}
        ${!isMechanic && sidebarData?.suggestedShop ? `<div class="summary-section"><p><strong>${t('suggestedShop')}:</strong> ${sidebarData.suggestedShop}</p></div>` : ''}
        ${!isMechanic && sidebarData?.proformaURL ? `<div class="summary-section"><p><strong>Proforma:</strong> <a href="${sidebarData.proformaURL}" target="_blank" class="file-attachment-link">View Document</a></p></div>` : ''}

        ${mechanicSidebarControlsHtml}
      </aside>
    </div>
  `;

  scrollToBottom('chat-messages-area');

  const chatInputEl = document.getElementById('chat-message-input') as HTMLTextAreaElement;
  const sendBtnEl = document.getElementById('send-chat-message-btn');
  const attachBtnEl = document.getElementById('attach-file-btn');
  const fileInputEl = document.getElementById('chat-file-input');

  if (chatInputEl) {
      chatInputEl.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
          }
      });
  } else {
      console.error("renderChatPage: chat-message-input element NOT found!");
  }

  if (sendBtnEl) {
      sendBtnEl.addEventListener('click', handleSendMessage);
  } else {
      console.error("renderChatPage: send-chat-message-btn element NOT found!");
  }
  
  if (attachBtnEl && fileInputEl) { // Ensure both exist
      attachBtnEl.addEventListener('click', () => {
        (fileInputEl as HTMLInputElement).click();
      });
  } else {
      console.error("renderChatPage: attach-file-btn or chat-file-input element NOT found!");
  }
  
  if (fileInputEl) {
    fileInputEl.addEventListener('change', handleFileUpload);
  } else {
      console.error("renderChatPage: chat-file-input element NOT found!");
  }
  
  if (isMechanic) {
    document.getElementById('save-mechanic-updates-btn')?.addEventListener('click', handleSaveMechanicUpdates);
  }
}

function renderContactUsPage() {
  if (!appMain) return;
  appMain.innerHTML = `
    <div class="contact-us-page">
      <h2>${t('contactUsTitle')}</h2>
      <div class="contact-content">
        <div class="contact-info">
          <h3>${t('contactInfo')}</h3>
          <p><strong>${t('phone')}:</strong> ${t('placeholderPhone')}</p>
          <p><strong>${t('email')}:</strong> ${t('placeholderEmail')}</p>
          <p><strong>${t('address')}:</strong> ${t('placeholderAddress')}</p>
        </div>
        <div class="contact-form-container">
          <h3>${t('contactFormMessage')}</h3>
          <form id="contact-form" aria-labelledby="contact-form-main-title">
            <h3 id="contact-form-main-title" class="sr-only">${t('contactFormMessage')}</h3>
            <div class="form-group">
              <label for="contactName">${t('name')}</label>
              <input type="text" id="contactName" name="contactName" placeholder="${t('namePlaceholder')}" required autocomplete="name">
            </div>
            <div class="form-group">
              <label for="contactEmail">${t('email')}</label>
              <input type="email" id="contactEmail" name="contactEmail" placeholder="${t('placeholderEmail')}" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="contactMessage">${t('contactFormMessage')}</label>
              <textarea id="contactMessage" name="contactMessage" rows="5" placeholder="${t('contactFormMessagePlaceholder')}" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">${t('submitMessage')}</button>
          </form>
        </div>
      </div>
    </div>
  `;
  document.getElementById('contact-form')?.addEventListener('submit', handleContactFormSubmit);
}

async function renderMechanicDashboardPage() {
    if (!appMain || !appState.isCurrentUserMechanic) {
        appState.currentView = 'login'; 
        renderApp(); 
        return;
    }
    await fetchDiagnosisRequestsForMechanic();

    const filteredRequests = appState.currentMechanicDashboardFilter === 'all'
        ? appState.diagnosisRequestsForMechanic
        : appState.diagnosisRequestsForMechanic.filter(req => req.status === appState.currentMechanicDashboardFilter);
    
    const requestsHtml = filteredRequests.length > 0
        ? `<ul class="dashboard-request-list">
            ${filteredRequests.map(req => `
              <li class="dashboard-request-item card">
                <h4>${req.carModel || 'Vehicle Issue'} - User: ${req.userName}</h4>
                <p><strong>Issue:</strong> ${req.carIssue.substring(0, 100)}${req.carIssue.length > 100 ? '...' : ''}</p>
                <p><strong>${t('statusLabel')}:</strong> <span class="status-${req.status}">${t(`status${req.status.charAt(0).toUpperCase() + req.status.slice(1)}` as keyof typeof uiStrings.en) || req.status}</span></p>
                <p><strong>${t('createdAtLabel')}:</strong> ${req.createdAt && req.createdAt.toDate ? req.createdAt.toDate().toLocaleDateString() : t('notAvailable')}</p>
                <button class="btn btn-primary btn-small view-request-btn" data-diagnosis-id="${req.id}">${t('viewChat')}</button>
              </li>
            `).join('')}
           </ul>`
        : `<p>${t('noDiagnosisRequests')}</p>`;

    appMain.innerHTML = `
        <div class="mechanic-dashboard-page">
            <h2>${t('mechanicDashboardTitle')}</h2>
            <div class="dashboard-filters">
                <label for="status-filter">${t('filterByStatus')}</label>
                <select id="status-filter" class="form-control">
                    <option value="all" ${appState.currentMechanicDashboardFilter === 'all' ? 'selected' : ''}>${t('allStatuses')}</option>
                    <option value="submitted" ${appState.currentMechanicDashboardFilter === 'submitted' ? 'selected' : ''}>${t('statusSubmitted')}</option>
                    <option value="in_progress" ${appState.currentMechanicDashboardFilter === 'in_progress' ? 'selected' : ''}>${t('statusInProgress')}</option>
                    <option value="awaiting_user_info" ${appState.currentMechanicDashboardFilter === 'awaiting_user_info' ? 'selected' : ''}>${t('statusAwaitingUserInfo')}</option>
                     <option value="parts_ordered" ${appState.currentMechanicDashboardFilter === 'parts_ordered' ? 'selected' : ''}>${t('statusPartsOrdered')}</option>
                    <option value="resolved" ${appState.currentMechanicDashboardFilter === 'resolved' ? 'selected' : ''}>${t('statusResolved')}</option>
                    <option value="closed" ${appState.currentMechanicDashboardFilter === 'closed' ? 'selected' : ''}>${t('statusClosed')}</option>
                </select>
            </div>
            ${requestsHtml}
        </div>
    `;

    document.getElementById('status-filter')?.addEventListener('change', (e) => {
        appState.currentMechanicDashboardFilter = (e.target as HTMLSelectElement).value;
        renderApp(); 
    });

    document.querySelectorAll('.view-request-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const diagnosisId = (e.currentTarget as HTMLElement).dataset.diagnosisId;
            if (diagnosisId) {
                appState.currentDiagnosisId = diagnosisId;
                const selectedRequest = appState.diagnosisRequestsForMechanic.find(r => r.id === diagnosisId);
                appState.activeDiagnosisForSidebar = selectedRequest || null;
                appState.currentView = 'chat';
                renderApp();
            }
        });
    });
}


// --- Event Handlers & Logic ---

async function handleLogin(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    appState.authError = null;

    try {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
        console.error("Login error:", error);
        appState.authError = getFirebaseAuthErrorMessage(error.code);
        renderApp(); 
    }
}

async function handleSignUp(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const displayName = (form.elements.namedItem('displayName') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
    appState.authError = null;

    if (password !== confirmPassword) {
        appState.authError = "Passwords do not match."; 
        renderApp();
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (displayName && userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
        }
    } catch (error: any) {
        console.error("Sign up error:", error);
        appState.authError = getFirebaseAuthErrorMessage(error.code);
        renderApp(); 
    }
}

function getFirebaseAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
        case 'auth/invalid-email':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return t('authLoginError');
        case 'auth/email-already-in-use':
        case 'auth/weak-password':
            return t('authSignUpError');
        default:
            return t('authDefaultError');
    }
}


async function handleLogout() {
    try {
        if (appState.chatListenerUnsubscribe) {
            appState.chatListenerUnsubscribe();
            appState.chatListenerUnsubscribe = null;
        }
        await signOut(firebaseAuth);
    } catch (error) {
        console.error("Logout error:", error);
    }
}


async function handleFormSubmit(event: Event) {
  event.preventDefault();

  if (!appState.currentUser) {
    appState.currentView = 'login';
    renderApp();
    return;
  }

  const form = event.target as HTMLFormElement;
  const rawFormData = new FormData(form);

  const tempFormData = {
    name: rawFormData.get('name') as string || (appState.currentUser.displayName || appState.currentUser.email || ''),
    carModel: rawFormData.get('carModel') as string || '',
    licensePlate: rawFormData.get('licensePlate') as string || '',
    vin: rawFormData.get('vin') as string || '',
    carIssue: rawFormData.get('carIssue') as string || '',
    carPhoto: (form.elements.namedItem('carPhoto') as HTMLInputElement)?.files?.[0] || null,
    engineSound: (form.elements.namedItem('engineSound') as HTMLInputElement)?.files?.[0] || null,
    diagnosisMethod: rawFormData.get('diagnosisMethod') as string || 'liveChat',
    preferredDiagnosisLanguage: rawFormData.get('preferredDiagnosisLanguage') as string || 'en',
  };

  const diagnosisData: Omit<DiagnosisRequest, 'id' | 'createdAt'> & { createdAt: any } = {
    userId: appState.currentUser.uid,
    userName: tempFormData.name,
    userEmail: appState.currentUser.email,
    carModel: tempFormData.carModel,
    licensePlate: tempFormData.licensePlate,
    vin: tempFormData.vin,
    carIssue: tempFormData.carIssue,
    diagnosisMethod: tempFormData.diagnosisMethod,
    preferredDiagnosisLanguage: tempFormData.preferredDiagnosisLanguage,
    status: 'submitted',
    createdAt: serverTimestamp(),
    userLocation: '',
  };

  try {
    if (tempFormData.carPhoto) {
      const photoFile = tempFormData.carPhoto;
      const photoRef = ref(storage, `diagnosis_files/${appState.currentUser.uid}/${Date.now()}_${photoFile.name}`);
      await uploadBytes(photoRef, photoFile);
      diagnosisData.carPhotoUrl = await getDownloadURL(photoRef);
      diagnosisData.carPhotoName = photoFile.name;
    }

    if (tempFormData.engineSound) {
      const soundFile = tempFormData.engineSound;
      const soundRef = ref(storage, `diagnosis_files/${appState.currentUser.uid}/${Date.now()}_${soundFile.name}`);
      await uploadBytes(soundRef, soundFile);
      diagnosisData.engineSoundUrl = await getDownloadURL(soundRef);
      diagnosisData.engineSoundName = soundFile.name;
    }

    const docRef = await addDoc(collection(db, "diagnosisRequests"), diagnosisData);
    appState.currentDiagnosisId = docRef.id;
    appState.hasSubmittedDiagnosis = true;

    const clientSideCreatedAt = Timestamp.now();

    appState.formData = {
      ...tempFormData,
      userLocation: '',
      name: diagnosisData.userName,
    };

    appState.activeDiagnosisForSidebar = {
      ...diagnosisData,
      id: docRef.id,
      createdAt: clientSideCreatedAt,
      userLocation: '',
    };

    appState.currentView = 'chat';
    await startChatSessionInitialMessages();

    renderApp();

  } catch (error) {
    console.error("Error submitting diagnosis request:", error);
    alert("Error submitting request: " + (error as Error).message);
  }
}

  async function startChatSessionInitialMessages() {
      if (!appState.currentDiagnosisId || !appState.currentUser) {
          console.error("Cannot start chat session: missing diagnosis ID or user.");
          return;
      }
    
    // Fetch current details for sidebar (includes potential userLocation)
    await fetchActiveDiagnosisDetailsForSidebar();

    const messagesQuery = query(
        collection(db, 'diagnosisRequests', appState.currentDiagnosisId, 'messages'),
        orderBy('timestamp')
    );
    const initialMessagesSnapshot = await getDocs(messagesQuery);

    // Only send initial prompt if no messages exist and location hasn't been provided yet
    if (initialMessagesSnapshot.empty && (!appState.activeDiagnosisForSidebar || !appState.activeDiagnosisForSidebar.userLocation)) {
        const userNameForChat = appState.activeDiagnosisForSidebar?.userName || appState.formData.name || t('user');
        const vehicleDescription = appState.activeDiagnosisForSidebar?.carModel || appState.formData.carModel || t('chatVehicle');
        await addChatMessage('mechanic', t('chatAskLocation', userNameForChat, vehicleDescription));
    }
}


async function addChatMessage(
    sender: ChatMessage['sender'], 
    text: string, 
    type: ChatMessage['type'] = 'text', 
    fileName?: string, 
    fileURL?: string
): Promise<void> { // Return Promise for await
  if (!appState.currentDiagnosisId) {
    console.error("Cannot add chat message: no currentDiagnosisId.");
    return;
  }
 
  if ((sender === 'user' || (sender === 'mechanic' && appState.isCurrentUserMechanic)) && !appState.currentUser) {
      console.error(`Cannot send ${sender} message: no current user or not a logged-in mechanic.`);
      return;
  }

  let messageUserId: string | undefined;
  if (sender === 'user' && appState.currentUser) {
      messageUserId = appState.currentUser.uid;
  } else if (sender === 'mechanic') {
      if (appState.isCurrentUserMechanic && appState.currentUser) {
          messageUserId = appState.currentUser.uid;
      } else {
          messageUserId = 'virtual_mechanic_system'; // System generated 'mechanic' message
      }
  } else if (sender === 'ai') { // Though AI responses are removed, keep for message structure if needed
      messageUserId = 'ai_assistant_placeholder';
  }


  const messageData: any = {
    sender,
    text,
    type,
    timestamp: serverTimestamp(),
    userId: messageUserId,
  };
  if (fileName) messageData.fileName = fileName;
  if (fileURL) messageData.fileURL = fileURL;

  try {
    await addDoc(collection(db, 'diagnosisRequests', appState.currentDiagnosisId, 'messages'), messageData);
    // Firestore listener will update appState.chatMessages and re-render
  } catch (error) {
    console.error("Error adding chat message to Firestore:", error);
  }
}

async function handleSendMessage() {
  const input = document.getElementById('chat-message-input') as HTMLTextAreaElement;
  if (!input) {
    console.error("handleSendMessage: chat-message-input element NOT found!");
    return;
  }

  const text = input.value.trim();
  if (!text) return;

  if (!appState.currentDiagnosisId || !appState.currentUser) {
    alert(t('errorNoDiagnosisChat'));
    appState.currentView = appState.isCurrentUserMechanic ? 'mechanicDashboard' : 'diagnosisForm';
    renderApp();
    return;
  }

  const senderRole: ChatMessage['sender'] = appState.isCurrentUserMechanic ? 'mechanic' : 'user';
  await addChatMessage(senderRole, text);
  input.value = '';
  input.style.height = 'auto'; 
  input.focus(); 

  // If a non-mechanic user sends a message AND their location hasn't been recorded yet in activeDiagnosisForSidebar
  if (!appState.isCurrentUserMechanic && senderRole === 'user' && appState.activeDiagnosisForSidebar && !appState.activeDiagnosisForSidebar.userLocation) {
    try {
        await updateDoc(doc(db, 'diagnosisRequests', appState.currentDiagnosisId), {
            userLocation: text // The user's message `text` is assumed to be the location
        });
        // Update local state immediately for the sidebar
        appState.activeDiagnosisForSidebar.userLocation = text; 
        
        const carIssueForThanks = appState.activeDiagnosisForSidebar?.carIssue || t('chatVehicle');
        const userNameForThanks = appState.activeDiagnosisForSidebar?.userName || t('user'); 
        // Send the "thank you for location" message from the system 'mechanic'
        await addChatMessage('mechanic', t('chatLocationThanks', text, carIssueForThanks));
        // Re-render to show updated location in sidebar and the new message
        if(appState.currentView === 'chat') renderApp();

    } catch (e) {
        console.error("Failed to update diagnosis with location or send thanks message:", e);
    }
  }
}


async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        const file = input.files[0];
        if (!appState.currentDiagnosisId || !appState.currentUser) {
            alert(t('errorNoDiagnosisChat'));
            appState.currentView = appState.isCurrentUserMechanic ? 'mechanicDashboard' : 'diagnosisForm';
            renderApp();
            return;
        }
        const uploaderRole: ChatMessage['sender'] = appState.isCurrentUserMechanic ? 'mechanic' : 'user';
        await addChatMessage(uploaderRole, t('uploadingFile'), 'text'); 

        try {
            const storageRefPath = `chat_files/${appState.currentDiagnosisId}/${appState.currentUser.uid}/${Date.now()}_${file.name}`;
            const storageRefHandle = ref(storage, storageRefPath);
            const snapshot = await uploadBytes(storageRefHandle, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            await addChatMessage(uploaderRole, t('fileUploaded', file.name), 'file', file.name, downloadURL);
            
        } catch (error) {
            console.error("Error uploading file to chat:", error);
            await addChatMessage('mechanic', "Sorry, there was an error uploading your file. Please try again.");
        } finally {
            input.value = ''; 
        }
    }
}

function setupChatListener() {
    if (appState.chatListenerUnsubscribe) {
        appState.chatListenerUnsubscribe(); 
        appState.chatListenerUnsubscribe = null;
        console.log("setupChatListener: Detached existing listener.");
    }

    if (!appState.currentDiagnosisId || !appState.currentUser) {
        console.log("setupChatListener: No currentDiagnosisId or currentUser. Clearing messages and returning.");
        appState.chatMessages = []; 
        if (appState.currentView === 'chat') renderApp(); 
        return;
    }
    console.log("setupChatListener: Setting up listener for diagnosis ID:", appState.currentDiagnosisId);

    const messagesQuery = query(
        collection(db, 'diagnosisRequests', appState.currentDiagnosisId, 'messages'),
        orderBy('timestamp')
    );

    appState.chatListenerUnsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const messages: ChatMessage[] = [];
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const firestoreTimestamp = data.timestamp as Timestamp | null;
            messages.push({
                id: docSnapshot.id,
                sender: data.sender,
                text: data.text,
                timestamp: firestoreTimestamp && typeof firestoreTimestamp.toDate === 'function' ? firestoreTimestamp.toDate() : new Date(),
                type: data.type,
                fileName: data.fileName,
                fileURL: data.fileURL,
                userId: data.userId
            } as ChatMessage);
        });
        appState.chatMessages = messages;
        
        if (appState.currentView === 'chat') {
          renderApp(); 
          scrollToBottom('chat-messages-area');
        }
    }, (error) => {
        console.error("Error in chat listener:", error);
    });
}

async function handleContactFormSubmit(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formDataObject = Object.fromEntries(new FormData(form).entries());
  try {
    await addDoc(collection(db, "contactSubmissions"), {
      ...formDataObject,
      submittedAt: serverTimestamp()
    });
    alert(t('messageSentSuccess'));
    form.reset();
  } catch (error) {
    console.error("Error submitting contact form:", error);
    alert("Sorry, there was an error sending your message. Please try again.");
  }
}


async function fetchDiagnosisRequestsForMechanic() {
    if (!appState.isCurrentUserMechanic || !appState.currentUser) { // Added currentUser check
        appState.diagnosisRequestsForMechanic = []; 
        return;
    }
    try {
        const q = query(collection(db, "diagnosisRequests"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const requests: DiagnosisRequest[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            requests.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null // Ensure createdAt is Timestamp or null
            } as DiagnosisRequest);
        });
        appState.diagnosisRequestsForMechanic = requests;
    } catch (error) {
        console.error("Error fetching diagnosis requests for mechanic:", error);
        appState.diagnosisRequestsForMechanic = []; 
    }
}

async function fetchUserDiagnosisHistory() {
    if (!appState.currentUser) return;
    try {
        const q = query(
            collection(db, "diagnosisRequests"),
            where("userId", "==", appState.currentUser.uid),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const requests: DiagnosisRequest[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            requests.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null // Ensure createdAt is Timestamp or null
            } as DiagnosisRequest);
        });
        appState.diagnosisRequestsForUser = requests;
    } catch (error) {
        console.error("Error fetching user diagnosis history:", error);
    }
}

async function fetchActiveDiagnosisDetailsForSidebar() {
    if (appState.currentDiagnosisId && (!appState.activeDiagnosisForSidebar || appState.activeDiagnosisForSidebar.id !== appState.currentDiagnosisId)) {
        try {
            const docRef = doc(db, "diagnosisRequests", appState.currentDiagnosisId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                appState.activeDiagnosisForSidebar = { 
                    id: docSnap.id, 
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null // Ensure createdAt is Timestamp or null
                } as DiagnosisRequest;
            } else {
                appState.activeDiagnosisForSidebar = null;
            }
        } catch (error) {
            console.error("Error fetching active diagnosis for sidebar:", error);
            appState.activeDiagnosisForSidebar = null;
        }
    }
}


async function handleSaveMechanicUpdates() {
    if (!appState.isCurrentUserMechanic || !appState.currentDiagnosisId) return;

    const newStatus = (document.getElementById('mechanic-status-select') as HTMLSelectElement)?.value as DiagnosisRequest['status'];
    const notes = (document.getElementById('mechanic-notes-input') as HTMLTextAreaElement)?.value;
    const parts = (document.getElementById('recommended-parts-input') as HTMLInputElement)?.value;
    const shop = (document.getElementById('suggested-shop-input') as HTMLInputElement)?.value;
    const proforma = (document.getElementById('proforma-url-input') as HTMLInputElement)?.value;

    const updates: Partial<DiagnosisRequest> = {
        status: newStatus,
        mechanicNotes: notes,
        recommendedParts: parts,
        suggestedShop: shop,
        proformaURL: proforma
    };

    try {
        const docRef = doc(db, "diagnosisRequests", appState.currentDiagnosisId);
        await updateDoc(docRef, updates);
        
        if(appState.activeDiagnosisForSidebar) {
            appState.activeDiagnosisForSidebar = { ...appState.activeDiagnosisForSidebar, ...updates };
        }
        alert(t('updatesSavedSuccess'));
        renderApp(); 
    } catch (error) {
        console.error(t('errorSavingMechanicUpdates'), error);
        alert(t('errorSavingMechanicUpdates'));
    }
}


function toggleLanguage() {
  appState.language = appState.language === 'en' ? 'rw' : 'en';
  saveState();
  renderApp();
}

function toggleTheme() {
  appState.theme = appState.theme === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark-mode', appState.theme === 'dark');
  saveState();
  renderApp(); 
}

function applyTheme() {
  document.body.classList.toggle('dark-mode', appState.theme === 'dark');
}

function scrollToBottom(elementId: string) {
  const element = document.getElementById(elementId);
  if (element) {
    setTimeout(() => {
        element.scrollTop = element.scrollHeight;
    }, 100); 
  }
}

function saveState() {
  localStorage.setItem('smartGarageState', JSON.stringify({
    language: appState.language,
    theme: appState.theme,
    currentDiagnosisId: appState.currentDiagnosisId, 
  }));
}

function loadState() {
  const stateString = localStorage.getItem('smartGarageState');
  if (stateString) {
    const savedState = JSON.parse(stateString);
    appState.language = savedState.language || 'en';
    appState.theme = savedState.theme || 'light';
    appState.currentDiagnosisId = savedState.currentDiagnosisId || null;
    if(appState.currentDiagnosisId) appState.hasSubmittedDiagnosis = true; 
  }
}

function renderApp() {
  if (!appContainer || !appHeader || !appMain || !appFooter) {
    console.error('Core application elements not found in the DOM.');
    return;
  }

  const nonAuthViews = ['home', 'login', 'contactUs'];
  if (!appState.currentUser && !nonAuthViews.includes(appState.currentView) && appState.currentView !== 'diagnosisForm') {
    appState.currentView = 'login';
    appState.loginFormMode = 'login'; 
    appState.authError = null;
  }
  if (appState.currentUser && appState.currentView === 'login') {
      appState.currentView = appState.isCurrentUserMechanic ? 'mechanicDashboard' : 'profile';
  }
  if (appState.currentUser && !appState.isCurrentUserMechanic && appState.currentView === 'mechanicDashboard') {
      appState.currentView = 'profile';
  }
  if (appState.isCurrentUserMechanic && appState.currentView === 'diagnosisForm') {
      appState.currentView = 'mechanicDashboard';
  }
  
  applyTheme(); 
  renderHeader(); 

  // Clear main content before rendering new view to prevent old listeners from lingering on detached elements
  // However, this is less of an issue if listeners are re-added by each render function.
  // appMain.innerHTML = ''; // Optional: if you face issues with stale content or listeners.

  if (appState.currentView === 'mechanicDashboard') {
    renderMechanicDashboardPage(); 
  } else if (appState.currentView === 'profile') {
    renderProfilePage();
  } else if (appState.currentView === 'chat') {
    renderChatPage(); // This will internally call setupChatListener if needed
  } else {
    switch (appState.currentView) {
      case 'home': renderHomePage(); break;
      case 'login': renderLoginPage(); break;
      case 'diagnosisForm': renderDiagnosisFormPage(); break;
      case 'contactUs': renderContactUsPage(); break;
      default: renderHomePage();
    }
  }
  renderFooter();
    
  const chatInput = document.getElementById('chat-message-input') as HTMLTextAreaElement;
  if (chatInput) { 
      chatInput.style.height = 'auto'; 
      chatInput.style.height = chatInput.scrollHeight + 'px'; 
      // This listener is for auto-resize, separate from send logic.
      // Ensure it's not added multiple times if renderApp is called often for non-chat views.
      // A more robust way would be to manage this listener within renderChatPage or ensure it's idempotent.
      // For simplicity, keeping it here, but be mindful if multiple listeners cause issues.
      const existingListener = (chatInput as any)._autoResizeListener;
      if (existingListener) {
          chatInput.removeEventListener('input', existingListener);
      }
      const newListener = () => {
          chatInput.style.height = 'auto';
          chatInput.style.height = chatInput.scrollHeight + 'px';
      };
      chatInput.addEventListener('input', newListener);
      (chatInput as any)._autoResizeListener = newListener;
  }
}

function main() {
  appContainer = document.getElementById('app-container');
  appHeader = document.getElementById('app-header');
  appMain = document.getElementById('app-main');
  appFooter = document.getElementById('app-footer');

  if (!appContainer || !appHeader || !appMain || !appFooter) {
    console.error('Failed to initialize app: core DOM elements missing.');
    document.body.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">Critical Error: Application cannot start. Essential HTML elements are missing.</p>';
    return;
  }
  
  loadState(); 

  onAuthStateChanged(firebaseAuth, async (user) => { // Added async here
    const previousUser = appState.currentUser;
    appState.currentUser = user;
    appState.isCurrentUserMechanic = user ? MECHANIC_UIDS.includes(user.uid) : false;
    appState.authError = null; 
    
    if (!user && previousUser) { // User logged out
      if (appState.chatListenerUnsubscribe) {
        appState.chatListenerUnsubscribe();
        appState.chatListenerUnsubscribe = null;
      }
      appState.hasSubmittedDiagnosis = false; 
      appState.chatMessages = []; 
      appState.currentDiagnosisId = null; 
      appState.activeDiagnosisForSidebar = null;
      appState.diagnosisRequestsForMechanic = [];
      appState.diagnosisRequestsForUser = [];
      localStorage.removeItem('smartGarageState'); 
      appState.formData = { 
            name: '', carModel: '', licensePlate: '', vin: '', carIssue: '',
            carPhoto: null, engineSound: null, diagnosisMethod: 'liveChat',
            preferredDiagnosisLanguage: appState.language, userLocation: ''
      };
      const protectedViewsWhileLoggedOut = ['profile', 'chat', 'mechanicDashboard'];
      if (protectedViewsWhileLoggedOut.includes(appState.currentView)) {
        appState.currentView = 'home'; 
      }
    } else if (user && !previousUser) { // User logged in
        if(appState.currentView === 'login' || appState.currentView === 'diagnosisForm' || !appState.currentView /* initial load potentially */) { 
            appState.currentView = appState.isCurrentUserMechanic ? 'mechanicDashboard' : (appState.currentDiagnosisId ? 'chat' : 'profile');
        }
        // If logging in and going to chat, ensure sidebar and listener are set up
        if (appState.currentDiagnosisId && appState.currentView === 'chat') {
            await fetchActiveDiagnosisDetailsForSidebar(); // await this
            // setupChatListener will be called by renderChatPage
        }
    } else if (user && appState.currentDiagnosisId && appState.currentView === 'chat' && !appState.chatListenerUnsubscribe) {
        // This case handles if user was already logged in, on chat page, but listener somehow got detached (e.g. page refresh with saved state)
        await fetchActiveDiagnosisDetailsForSidebar(); // await this
         // setupChatListener will be called by renderChatPage
    }
    renderApp(); 
  });
}

const style = document.createElement('style');
style.innerHTML = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  .file-attachment-link {
    color: var(--primary-color);
    text-decoration: underline;
  }
  body.dark-mode .file-attachment-link {
    color: var(--primary-color-dark-mode);
  }
  .status-submitted { color: #007bff; }
  .status-in_progress { color: #ffc107; }
  .status-awaiting_user_info { color: #fd7e14; }
  .status-parts_ordered { color: #6f42c1;}
  .status-resolved { color: #28a745; }
  .status-closed { color: #6c757d; }
  .status-unknown { color: var(--text-secondary-light); }
  body.dark-mode .status-unknown { color: var(--text-secondary-dark); }


  .dashboard-request-list { list-style: none; padding: 0; }
  .dashboard-request-item { 
    background-color: var(--surface-color-light); 
    border: 1px solid var(--border-color-light);
    border-radius: var(--border-radius);
    padding: 15px; margin-bottom: 15px; 
    box-shadow: var(--box-shadow-current);
  }
  body.dark-mode .dashboard-request-item {
    background-color: var(--surface-color-dark);
    border-color: var(--border-color-dark);
  }
  .dashboard-request-item h4 { margin-top: 0; color: var(--primary-color); }
  .dashboard-filters { margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
  .dashboard-filters label { font-weight: 500; }
  .dashboard-filters select.form-control { width: auto; min-width: 200px; }
  
  .mechanic-dashboard-page .card { 
    background-color: var(--surface-color-light); 
    border: 1px solid var(--border-color-light);
    border-radius: var(--border-radius);
    padding: 15px; margin-bottom: 15px; 
    box-shadow: var(--box-shadow-current);
  }
   body.dark-mode .mechanic-dashboard-page .card {
    background-color: var(--surface-color-dark);
    border-color: var(--border-color-dark);
  }

  .chat-sidebar .form-control {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--border-color-light);
      border-radius: var(--border-radius);
      box-sizing: border-box;
      font-size: 0.9em;
      background-color: var(--background-color-light);
      color: var(--text-color-light);
      margin-bottom: 10px; 
  }
  body.dark-mode .chat-sidebar .form-control {
      background-color: var(--surface-color-dark);
      color: var(--text-color-dark);
      border-color: var(--border-color-dark);
  }
  .chat-sidebar .mechanic-controls h4 { font-size: 0.95em; margin-bottom: 5px; }
  .btn-small { padding: 6px 12px; font-size: 0.9em; }
  .chat-id-display { font-size: 0.7em; color: var(--text-secondary-light); }
  body.dark-mode .chat-id-display { color: var(--text-secondary-dark); }

  .diagnosis-history-list { list-style: none; padding: 0; }
  .diagnosis-history-item { 
    background-color: var(--surface-color-light); 
    border: 1px solid var(--border-color-light);
    border-radius: var(--border-radius);
    padding: 15px; margin-bottom: 10px; 
  }
  body.dark-mode .diagnosis-history-item {
    background-color: var(--surface-color-dark);
    border-color: var(--border-color-dark);
  }
  .history-item-summary { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .history-item-model { font-weight: 600; }
  .history-item-status { font-size: 0.9em; padding: 3px 7px; border-radius: 4px; font-weight: 500; }
  .history-item-details p { font-size: 0.9em; margin: 4px 0; }
  .chat-placeholder { text-align: center; color: var(--text-secondary-light); margin-top: 20px;}
  body.dark-mode .chat-placeholder { color: var(--text-secondary-dark); }
`;
document.head.appendChild(style);

main();
