# SYSTEM CONTROL CENTER - প্রোফাইল, সেটিংস ও টাইমলাইন

## ১. প্রোফাইল সেকশন (Identity Hub)

### ১.১ IdentityHero.tsx - সভেরিন আইডি প্রদর্শন

**সভেরিন আইডি (Sovereign Identity):**

```typescript
// IdentityHero.tsx:417 - ফুটারে দেখানো হয়
NODE-{String(currentUser._id).slice(-8)}
```

এটি Vault Pro-এর **একক উৎস সত্য (Single Source of Truth)**। প্রতিটি ইউজারের একটি অনন্য MongoDB `_id` থাকে যা সিস্টেমে তাদের ডেন্টিটি নম্বর হিসেবে কাজ করে।

### ১.২ হেলথ স্কোর ক্যালকুলেশন

**IdentityHero.tsx:150-175** - ৪টি ফ্যাক্টর:

| ফ্যাক্টর | শর্ত | পয়েন্ট |
|----------|------|---------|
| প্রোফাইল সম্পূর্ণতা | `formData.name` এবং `formData.image` আছে | ২৫% |
| সিঙ্ক স্ট্যাটাস | কোন পেন্ডিং আইটেম নেই | ২৫% |
| ব্যাকআপ | `localStorage`-এ `last_backup_time` আছে | ২৫% |
| সেশন যাচাই | Google বা Credentials অথেনটিকেশন | ২৫% |

### ১.৩ স্মার্ট প্রোফাইল ইমেজ লজিক

**Priority Order** (IdentityHero.tsx:27-68):
1. **Uploading** - `cid_` প্রিফিক্স, প্রগ্রেস বার দেখায়
2. **Custom** - Cloudinary URL (আপলোড সম্পন্ন)
3. **Google** - Google OAuth থেকে প্রাপ্ত
4. **Placeholder** - ডিফল্ট অবস্থা

### ১.৪ DangerZone - আইডেন্টিটি টার্মিনেশন

**ফাইল:** `DangerZone.tsx`

**Nuclear Reset লজিক:**
1. ইমেইল টাইপ করতে হবে (Confirmation Input)
2. ইমেইল ম্যাচ করলে বাটন এনেবল হবে
3. DELETE রিকোয়েস্ট `/api/auth/delete` এ পাঠায়
4. `logout()` কল করে Zustand ক্লিয়ার করে

```typescript
// DangerZone.tsx:22
const isMatch = confirmationText.toLowerCase() === userEmail?.toLowerCase();

// useProfile.ts:191-210
const deleteAccount = async () => {
    const res = await fetch('/api/auth/delete', {
        method: 'DELETE',
        body: JSON.stringify({ userId: currentUser._id }),
    });
    if (res.ok) { 
        logout(); // Zustand ক্লিয়ার
        window.location.href = '/';
    }
};
```

---

## ২. সেটিংস সেকশন (Configuration Hub)

### ২.১ InterfaceEngine - টগল কন্ট্রোল

**ফাইল:** `InterfaceEngine.tsx`

**৬টি প্রোটোকল টগল:**

| প্রোটোকল | কী | ডোম ইফেক্ট |
|----------|---|------------|
| TURBO ENGINE | `turboMode` | `body.turbo-active` |
| MIDNIGHT PROTOCOL | `isMidnight` | `root.midnight-mode` |
| COMPACT INTERFACE | `compactMode` | `root.compact-deck` |
| SECURITY SHIELD | `autoLock` | - |
| SYSTEM MONITORING | `dailyReminder` | - |
| INTERACTIVE GUIDANCE | `showTooltips` | - |

### ২.২ Nuclear Reset - "Execute System Purge"

**ফাইল:** `SystemMaintenance.tsx:132-152`

```typescript
// useSettings.ts:128-132
const clearLocalCache = async () => {
    const { logout } = useVaultStore.getState();
    await logout(); // একই logout() ফাংশন
};
```

**⚠️ গুরুত্বপূর্ণ আবিষ্কার:**
- **DangerZone** এবং **SystemMaintenance** উভয়ই একই `logout()` ফাংশন ব্যবহার করে
- এটি শুধুমাত্র **Zustand Store** ক্লিয়ার করে
- **IndexedDB (Dexie) ক্লিয়ার করে না!**

### ২.৩ কারেন্সি এবং ল্যাঙ্গুয়েজ সেটিংস পার্সিস্টেন্স

**Dexie-তে সেভ হওয়া ডাটা:**

```typescript
// useSettings.ts:78-106
const atomicUpdate = async (patch) => {
    // 1. UI আপডেট (Zustand)
    if (patch.preferences) setPreferences(updatedPrefs);
    if (patch.categories) setCategories(updatedCats);
    if (patch.currency) setCurrency(updatedCurr);

    // 2. Dexie পার্সিস্টেন্স
    await db.users.update(currentUser._id, {
        preferences: updatedPrefs,
        categories: updatedCats,
        currency: updatedCurr,
        synced: 0,        // ব্যাকগ্রাউন্ড সিঙ্কের জন্য ফ্ল্যাগ
        updatedAt: Date.now()
    });
};
```

**স্টোরেজ স্ট্রাকচার:**
```
db.users
├── _id (MongoDB)
├── username
├── email
├── preferences: { turboMode, isMidnight, compactMode, autoLock, ... }
├── categories: string[]
├── currency: "BDT (৳)"
├── synced: 0 | 1
└── updatedAt: Unix MS
```

### ২.৪ useSettings হুক - ডুয়াল লেয়ার আর্কিটেকচার

```typescript
// useSettings.ts:109-112 - শুধু Zustand (তাৎক্ষণিক UI)
const updatePreference = (key, value) => {
    setPreferences({ [key]: value });
    // কোন Dexie কল নেই!
};

// useSettings.ts:78-106 - Zustand + Dexie + Handshake
const atomicUpdate = async (patch) => {
    // ...
    await db.users.update(currentUser._id, {...});
    dispatchHandshake();
};
```

---

## ৩. টাইমলাইন সেকশন (Life Log)

### ৩.১ TimelineSection - এন্ট্রি রেন্ডারিং

**ফাইল:** `TimelineSection.tsx`

```typescript
// TimelineSection.tsx:28-31
const entries = useLiveQuery(
    () => db.entries
        .where('userId').equals(String(currentUser._id))
        .and((e) => e.isDeleted === 0)
        .toArray(),
    []
) || [];
```

**ফিচারস:**
- **LiveQuery** - রিয়েল-টাইম অটো-আপডেট
- **UserId ফিল্টার** - শুধুমাত্র বর্তমান ইউজারের এন্ট্রি
- **Pagination** - ১০টি প্রতি পেজ
- **Virtualization** - ১০০০+ এন্ট্রি হলে

### ৩.২ টাইমলাইন ফিড - টেবিল ভিউ

**ফাইল:** `TimelineFeed.tsx`

**কলাম স্ট্রাকচার:**
| # | তারিখ | সময় | রেফ আইডি | প্রোটোকল | মেমো | ট্যাগ | ভায়া | পরিমাণ | স্ট্যাটাস | অপশন |
|---|-------|------|----------|----------|------|------|------|---------|---------|-------|
| 01 | ১৫ মার্চ | ১০:৩০ | a7b3c2 | বেতন | "মার্চের বেতন" | SALARY | CASH | +৳৫০,০০০ | COMPLETED | Edit/Delete |

### ৩.৩ ProtocolAuditLog - মক ডাটা

**⚠️ গুরুত্বপূর্ণ আবিষ্কার:**

`TimelineSection` আসলে **ফাইন্যান্সিয়াল এন্ট্রি** দেখায়, **রিয়েল অডিট লগ নয়!**

`ProtocolAuditLog.tsx:18-46` শুধু স্ট্যাটিক ডাটা দেখায়:

```typescript
const logs = [
    { event: 'Identity Hash Updated', time: 'Just Now', ... },
    { event: 'Master Backup Exported', time: '2 hours ago', ... },
    { event: 'Security Session Verified', time: 'Yesterday', ... },
];
```

এটি কোনো রিয়েল অডিট ট্রেইল নয় - শুধু ডিসপ্লে উদ্দেশ্যে।

---

## ৪. সিস্টেম আর্কিটেকচার ডায়াগ্রাম

```mermaid
graph TB
    subgraph Profile Section
        A[ProfileSection] --> B[IdentityHero]
        A --> C[SecurityForm]
        A --> D[DataSovereignty]
        A --> E[DangerZone]
        B --> F[NODE-{_id.slice(-8)}]
        B --> G[Health Score]
    end

    subgraph Settings Section
        H[SettingsSection] --> I[InterfaceEngine]
        H --> J[SystemRegistry]
        H --> K[SystemMaintenance]
        I --> L[6 Toggles]
        K --> M[clearLocalCache]
    end

    subgraph Timeline Section
        N[TimelineSection] --> O[useLiveQuery]
        N --> P[TimelineFeed]
        O --> Q[db.entries]
        P --> R[Table View]
    end

    subgraph Hooks
        S[useProfile] --> T[db.users.update]
        S --> U[logout]
        V[useSettings] --> W[atomicUpdate]
        V --> X[updatePreference]
    end

    subgraph Data Layer
        Y[Zustand Store]
        Z[Dexie IndexedDB]
    end

    A --> S
    H --> V
    N --> O
    S --> Y
    V --> Y
    S --> Z
    V --> Z
```

---

## ৫. সমস্যা ও সুপারিশ

### ৫.১ Nuclear Reset ইস্যু

**সমস্যা:**
- `logout()` শুধু Zustand ক্লিয়ার করে
- IndexedDB-তে ডাটা থেকে যায়

**সমাধান:**
```typescript
const clearLocalCache = async () => {
    // 1. Dexie ডাটাবেস ক্লিয়ার
    await db.books.clear();
    await db.entries.clear();
    await db.users.clear();
    await db.mediaStore.clear();
    
    // 2. Zustand ক্লিয়ার
    const { logout } = useVaultStore.getState();
    await logout();
};
```

### ৫.২ ProtocolAuditLog রিয়েল ইমপ্লিমেন্টেশন

**সমস্যা:**
- বর্তমানে স্ট্যাটিক মক ডাটা
- কোনো রিয়েল অডিট লগ সংরক্ষণ নেই

**সমাধান:**
```typescript
// অডিট লগ স্টোর করার জন্য নতুন টেবল
db.version(1).stores({
    auditLogs: '++id, userId, action, timestamp, details'
});
```

### ৫.৩ Currency/Language পার্সিস্টেন্স

**বর্তমান স্ট্যাটাস:** ✅ সঠিক
- Dexie-তে সংরক্ষিত
- `atomicUpdate()` সঠিকভাবে কাজ করছে

---

## ৬. উপসংহার

| কম্পোনেন্ট | স্ট্যাটাস | নোট |
|------------|---------|-----|
| Sovereign ID Display | ✅ কাজ করছে | NODE-{_id.slice(-8)} |
| Health Score | ✅ কাজ করছে | ৪টি ফ্যাক্টর |
| Nuclear Reset | ⚠️ অসম্পূর্ণ | শুধু Zustand ক্লিয়ার |
| Currency Persistence | ✅ কাজ করছে | Dexie-তে সেভ |
| Language Persistence | ✅ কাজ করছে | user preferences-এ |
| Timeline/Entries | ✅ কাজ করছে | useLiveQuery |
| Audit Logs | ❌ মক ডাটা | রিয়েল ইমপ্লিমেন্টেশন দরকার |

---

**ডকুমেন্ট ভার্সন:** V1.0  
**লাস্ট আপডেট:** ১১ মার্চ ২০২৬  
**অডিটর:** Kilo Code - Vault Pro Architect
