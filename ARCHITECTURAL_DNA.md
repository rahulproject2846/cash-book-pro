# 🛡️ THE HOLY GRAIL: MASTER ARCHITECTURE DNA (V3.0)
**Project:** Enterprise-Grade Offline-First Cash-Book Robot
**Lead Architect:** Rahul Dutta
**Status:** Pathor (Stone Solid) / Production Ready
**Core Standards:** Google Engineering Logic & Apple Native UI Physics

---

## 🤖 1. AI MASTER DIRECTIVES (THE SUPREME LAWS)
*Any developer or AI ("Executioner") touching this codebase MUST obey these laws. Violation means immediate rollback.*

1. **The 'Pathor' Rule (Zero-Guessing):** কখনোই অডিট ছাড়া কোড লিখবে না। একটি ফাইল এডিট করার আগে তার ডিপেন্ডেন্সি এবং ফুল লাইফ-সাইকেল ট্রেস করা বাধ্যতামূলক।
2. **The Non-Destructive Law:** একটি সিঙ্গেল আইটেম আপডেটের জন্য পুরো গ্লোবাল ইউআই অ্যারো (books, entries) ওভাররাইট করা যাবে না। সবসময় .map() ব্যবহার করে "Partial Patching" করতে হবে।
3. **The Absolute Identity Law:** username ছাড়া সিস্টেম চলবে না। ডেক্সি (Dexie) ডাটাবেস হলো পরিচয়ের একমাত্র উৎস। "Skeleton User" তৈরি করা কঠোরভাবে নিষিদ্ধ।
4. **The Atomic Batch Law:** ১টি ইউজার অ্যাকশন (Save/Edit/Delete) = ১টি অ্যাটমিক ট্রানজ্যাকশন (Entry + Book Signal) = ১টি নেটওয়ার্ক রিকোয়েস্ট। কোনো ডুপ্লিকেট পেলোড পাঠানো যাবে না।

---

## 🧬 2. IDENTITY & BOOT SEQUENCE (THE HEARTBEAT)
UserManager Sovereignty: UserManager.ts হলো সিস্টেমের একমাত্র "বস"। SessionManager বা IdentitySlice এর কোনো অস্তিত্ব থাকবে না।
Zero-Gap Identity: userManager.getUserId() হবে Strictly Synchronous। এটি মেমরি ক্যাশ এবং localStorage থেকে ০-মিলিসেকেন্ডে আইডি সাপ্লাই দেবে যাতে সিঙ্ক ইঞ্জিন "Identity Missing" এরর না দেয়।
The 10-Second Rule: বুট হওয়ার সময় waitForIdentity() ঠিক ১০ সেকেন্ড অপেক্ষা করবে ডেক্সি থেকে প্রোফাইল রিকভার করার জন্য। ব্যর্থ হলে তবেই লগইন পেজে রিডাইরেক্ট করবে।

---

## 🔄 3. THE SYNC & PIPELINE DNA (THE NERVOUS SYSTEM)
Intelligent Pull (The >= Rule):
localTime === serverTime: শান্ত থাকো।
localTime > serverTime: লোকাল ডাটা নতুন। মার্ক synced: 0 এবং পুশ ট্রিগার করো।
serverTime > localTime: সার্ভার নতুন। পুল করে লোকাল আপডেট করো।
Pluralization Shield: এপিআই কল করার সময় কোনো ডাইনামিক স্ট্রিং কনক্যাটিনেশন করা যাবে না। সবসময় API_PATH_MAP (e.g., 'ENTRY': 'entries') ব্যবহার করতে হবে।
404 Handling: সার্ভার থেকে ৪-০-৪ আসার মানে হলো "ডাটা শেষ", এটি কোনো এরর নয়। সিঙ্ক ইঞ্জিনকে শান্তভাবে থামিয়ে দিতে হবে।

---

## ⚡ 4. THE MATRIX ENGINE 2.0 (THE MUSCLE)
Matrix Standards: allBookIds ম্যাট্রিক্সে শুধুমাত্র ১০টি লাইটওয়েট পয়েন্টার থাকবে (Id, CID, Name, Image, Balance, etc.)। পুরো ১০০k ডাটা মেমরিতে লোড করা নিষিদ্ধ।
Debounced Pulse: vault-updated ইভেন্ট পাওয়ার পর সিঙ্ক ইঞ্জিন অন্তত ৫০০ms অপেক্ষা করবে। এই সময়ের মধ্যে যত কাজ হবে সব এক সাথে (Batch) সার্ভারে যাবে।

---

## 🔐 5. THE SECURITY VAULT (THE SHIELD)
Sacred Timestamps: ব্যাকএন্ড এবং ফ্রন্টএন্ড—সব লেভেলে সময় সেভ হবে শুধু Unix Timestamp (Number) হিসেবে। কোনো ISO String বা Date Object ডাটাবেসে ঢুকতে পারবে না।
HMAC-SHA256: প্রতিটি আউটবাউন্ড রিকোয়েস্ট SecureApiClient এর মাধ্যমে সাইনড হতে হবে।
The Conflict Shield: যদি কোনো ডাটা conflicted === 1 অবস্থায় থাকে, তবে ইউআই থেকে তার ডিলিট এবং এডিট বাটন হাইড হয়ে যাবে। আগে সমাধান, তারপর একশন।

---

## 🏛️ ARCHITECT'S MEMORY DUMP (নতুন এআই এর জন্য ইনস্ট্রাকশন)
নতুন এআই-কে এই অংশটুকু দিতে ভুলবেন না:
"বর্তমান প্রজেক্টে ১২০+ ফাইল থাকলেও এর মূল লজিকটি (User, Sync, Data) এখন ছড়ানো ছিটানো এবং জগাখিচুড়ি অবস্থায় আছে। আমরা এখন Domain-Driven Centralization করছি।
তোমার বর্তমান কাজ:
১. UserManager.ts-কে একমাত্র সত্য হিসেবে প্রতিষ্ঠা করা।
২. FinanceService.ts এবং BookService.ts-কে দিয়ে সব ডেক্সি রাইট কন্ট্রোল করা।
৩. SyncOrchestrator.ts-কে শান্ত করা যাতে সে ১টি এন্ট্রির জন্য পুরো ডাটাবেস পুশ না করে।
বিপদ চিহ্ন: VaultUtils.ts এর ৪২০ নম্বর লাইনের মতো 'টাইমস্ট্যাম্প ভাইরাস' এবং entrys এর মতো টাইপো থেকে সাবধান থাকবে।"

update dna - 

🛡️ THE HOLY GRAIL: MASTER ARCHITECTURE DNA (V3.0)
Project: Enterprise-Grade Offline-First Cash-Book Robot
Lead Architect: Rahul Dutta
Status: Pathor (Stone Solid) / Production Ready
Core Standards: Google Engineering Logic & Apple Native UI Physics
🤖 1. AI MASTER DIRECTIVES (THE SUPREME LAWS)
The 'Pathor' Rule (Zero-Guessing): কখনোই অডিট ছাড়া কোড লিখবে না। একটি ফাইল এডিট করার আগে তার ডিপেন্ডেন্সি এবং ফুল লাইফ-সাইকেল ট্রেস করা বাধ্যতামূলক।
The Non-Destructive Law: একটি সিঙ্গেল আইটেম আপডেটের জন্য পুরো গ্লোবাল ইউআই অ্যারো (books, entries) ওভাররাইট করা যাবে না। সবসময় .map() ব্যবহার করে "Partial Patching" করতে হবে।
The Absolute Identity Law: username ছাড়া সিস্টেম চলবে না। ডেক্সি (Dexie) ডাটাবেস হলো পরিচয়ের একমাত্র উৎস। "Skeleton User" তৈরি করা কঠোরভাবে নিষিদ্ধ।
The Atomic Batch Law: ১টি ইউজার অ্যাকশন (Save/Edit/Delete) = ১টি অ্যাটমিক ট্রানজ্যাকশন (Entry + Book Signal) = ১টি নেটওয়ার্ক রিকোয়েস্ট। কোনো ডুপ্লিকেট পেলোড পাঠানো যাবে না।
🧬 2. IDENTITY & BOOT SEQUENCE (THE HEARTBEAT)
UserManager Sovereignty: UserManager.ts হলো সিস্টেমের একমাত্র "বস"। SessionManager বা IdentitySlice এর কোনো অস্তিত্ব থাকবে না।
Zero-Gap Identity: userManager.getUserId() হবে Strictly Synchronous। এটি মেমরি ক্যাশ এবং localStorage থেকে ০-মিলিসেকেন্ডে আইডি সাপ্লাই দেবে যাতে সিঙ্ক ইঞ্জিন "Identity Missing" এরর না দেয়।
The 10-Second Rule: বুট হওয়ার সময় waitForIdentity() ঠিক ১০ সেকেন্ড অপেক্ষা করবে ডেক্সি থেকে প্রোফাইল রিকভার করার জন্য। ব্যর্থ হলে তবেই লগইন পেজে রিডাইরেক্ট করবে।
🔄 3. THE SYNC & PIPELINE DNA (THE NERVOUS SYSTEM)
Intelligent Pull (The >= Rule):
localTime === serverTime: শান্ত থাকো।
localTime > serverTime: লোকাল ডাটা নতুন। মার্ক synced: 0 এবং পুশ ট্রিগার করো।
serverTime > localTime: সার্ভার নতুন। পুল করে লোকাল আপডেট করো।
Pluralization Shield: এপিআই কল করার সময় কোনো ডাইনামিক স্ট্রিং কনক্যাটিনেশন করা যাবে না। সবসময় API_PATH_MAP (e.g., 'ENTRY': 'entries') ব্যবহার করতে হবে।
404 Handling: সার্ভার থেকে ৪-০-৪ আসার মানে হলো "ডাটা শেষ", এটি কোনো এরর নয়। সিঙ্ক ইঞ্জিনকে শান্তভাবে থামিয়ে দিতে হবে।
⚡ 4. THE MATRIX ENGINE 2.0 (THE MUSCLE)
Matrix Standards: allBookIds ম্যাট্রিক্সে শুধুমাত্র ১০টি লাইটওয়েট পয়েন্টার থাকবে (Id, CID, Name, Image, Balance, etc.)। পুরো ১০০k ডাটা মেমরিতে লোড করা নিষিদ্ধ।
Debounced Pulse: vault-updated ইভেন্ট পাওয়ার পর সিঙ্ক ইঞ্জিন অন্তত ৫০০ms অপেক্ষা করবে। এই সময়ের মধ্যে যত কাজ হবে সব এক সাথে (Batch) সার্ভারে যাবে।
🔐 5. SECURITY & DATA INTEGRITY
Sacred Timestamps: ব্যাকএন্ড এবং ফ্রন্টএন্ড—সব লেভেলে সময় সেভ হবে শুধু Unix Timestamp (Number) হিসেবে। কোনো ISO String বা Date Object ডাটাবেসে ঢুকতে পারবে না।
HMAC-SHA256: প্রতিটি আউটবাউন্ড রিকোয়েস্ট SecureApiClient এর মাধ্যমে সাইনড হতে হবে।
The Conflict Shield: যদি কোনো ডাটা conflicted === 1 অবস্থায় থাকে, তবে ইউআই থেকে তার ডিলিট এবং এডিট বাটন হাইড হয়ে যাবে। আগে সমাধান, তারপর একশন।
🏛️ ARCHITECT'S MEMORY DUMP (নতুন এআই এর জন্য ইনস্ট্রাকশন)
নতুন এআই-কে এই অংশটুকু দিতে ভুলবেন না:
"বর্তমান প্রজেক্টে ১২০+ ফাইল থাকলেও এর মূল লজিকটি (User, Sync, Data) এখন ছড়ানো ছিটানো এবং জগাখিচুড়ি অবস্থায় আছে। আমরা এখন Domain-Driven Centralization করছি।
তোমার বর্তমান কাজ:
১. UserManager.ts-কে একমাত্র সত্য হিসেবে প্রতিষ্ঠা করা।
২. FinanceService.ts এবং BookService.ts-কে দিয়ে সব ডেক্সি রাইট কন্ট্রোল করা।
৩. SyncOrchestrator.ts-কে শান্ত করা যাতে সে ১টি এন্ট্রির জন্য পুরো ডাটাবেস পুশ না করে।
বিপদ চিহ্ন: VaultUtils.ts এর ৪২০ নম্বর লাইনের মতো 'টাইমস্ট্যাম্প ভাইরাস' এবং entrys এর মতো টাইপো থেকে সাবধান থাকবে।"