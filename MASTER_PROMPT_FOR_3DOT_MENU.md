# 🎯 মাস্টার প্রম্পট - ৩-ডট মেনু অডিট ও সাজেশন

এই প্রম্পটটি যেকোনো AI-কে দিন (Windsurf, Cursor, Claude, বা অন্য যেকোনো AI টুল)। এটি আপনার প্রজেক্টের সম্পূর্ণ অডিট করে ৩-ডট মেনুতে যোগ করার জন্য সর্বোত্তম অপশনগুলো সাজেস্ট করবে।

---

## 📋 মাস্টার প্রম্পট (আপনি AI-কে এটি দেবেন):

আমার একটি Next.js + MongoDB + Pusher ভিত্তিক Cash Book/Financial Ledger অ্যাপ আছে। এটি একটি প্রোডাকশন-রেডি ফাইন্যান্সিয়াল অ্যাপ্লিকেশন।

তোমার কাজ হবে:

## ১. প্রথমে সম্পূর্ণ প্রজেক্ট অডিট করো:
- সমস্ত components ফোল্ডার চেক করো
- সমস্ত modals ও UI components দেখো
- Backend API routes অ্যানালাইজ করো
- Database models (Book, Entry, User) পড়ো
- Translation files পরীক্ষা করো

## ২. বর্তমান ৩-ডট মেনু লোকেশন খুঁজে বের করো:
- components/Layout/DynamicHeader.tsx ফাইলে "SuperMenu" আছে
- এখানে বর্তমানে যা আছে:
  * Analytics (Reports)
  * Share Access
  * Export Report
  * Edit Ledger (Edit Book)
  * Delete/Terminate Vault

## ৩. প্রতিটি পেজ ও ফিচার অ্যানালাইজ করো:
- Dashboard/Books Section
- Book Details Page  
- Transaction Table (Entry List)
- Settings Page
- Profile Page
- Timeline/History

## ৪. অডিট রিপোর্ট তৈরি করো (নিচের ক্যাটাগরিতে):

### 🔧 CRUD অপারেশনস (Create, Read, Update, Delete):
1. Add New Book - Create new ledger/book
2. Add New Entry - Add transaction
3. View Book Details - View single book
4. Edit Book - Modify book details
5. Delete Book - Delete/terminate book
6. Edit Entry - Modify transaction
7. Delete Entry - Remove transaction

### 📤 ডেটা ম্যানেজমেন্ট:
8. Export Data - Export to PDF/Excel
9. Import Data - Import from backup
10. Backup/Archive - Create local backup
11. Restore - Restore from backup

### 🔗 শেয়ারিং ও কোলাবোরেশন:
12. Share Access - Generate public link
13. QR Code Share - Share via QR
14. Copy Link - Copy shareable URL

### 📊 অ্যানালিটিক্স ও রিপোর্টিং:
15. Analytics/Reports - View analytics
16. Flow Velocity - Transaction speed
17. Capital Split - Income vs Expense chart
18. Monthly Summary - Monthly overview
19. Category Breakdown - Category analysis

### 🔐 সিকিউরিটি ও প্রাইভেসি:
20. Toggle Visibility - Make public/private
21. Lock/Unlock Vault - Lock book access
22. PIN Protection - Add PIN to book

### ⚙️ সিস্টেম সেটিংস:
23. Change Book Type - General/Customer/Supplier
24. Change Currency - Update currency
25. Categories Management - Add/edit categories
26. Payment Methods - Manage payment options

### 🔔 নোটিফিকেশন ও রিমাইন্ডার:
27. Set Reminder - Set payment reminder
28. Due Alert - Alert for pending amounts

### 📱 UI/UX ফিচার:
29. Pin Book - Pin to top
30. Search Entries - Search within book
31. Filter by Date - Date range filter
32. Filter by Category - Category filter
33. Sort Options - Sort entries

### 🎯 প্রোডাকশন-নিড ফিচার:
34. Duplicate Entry - Duplicate previous entry
35. Recurring Entry - Set recurring transaction
36. Bulk Delete - Delete multiple entries
37. Entry Status Toggle - Mark pending/completed

## ৫. আউটপুট ফরম্যাট:

তোমার রিপোর্ট অবশ্যই এই ফরম্যাটে হবে:

### 🏆 টপ ৫ মাস্ট হ্যাভ টু হ্যাভ (অবশ্যই যোগ করা উচিত):
1. [অপশন নাম] - [কী কাজ করে] - [কোড স্ট্রাকচার কেমন হবে]

... (মোট ৫টি)

### 📋 সম্পূর্ণ লিস্ট (২০+ অপশন):
1. [অপশন নাম] - [বিবরণ] - [প্রায়োরিটি: High/Medium/Low] - [ইমপ্লিমেন্টেশন ডিফিকাল্টি: Easy/Medium/Hard]

... (কমপক্ষে ২০টি)

### 🎯 রিকমেন্ডেশন:
- কোন অপশনগুলো প্রথমে করবে
- কোনটি কতটা সময় লাগবে
- কোনটি সবচেয়ে বেশি ইউজার ভ্যালু দেবে

## ৬. প্রতিটি অপশনের জন্য:
- বর্তমান কোডে কোথায় যোগ করতে হবে
- কোন ফাইল পরিবর্তন করতে হবে
- কোন API endpoint ব্যবহার করতে হবে বা নতুন তৈরি করতে হবে

শুরু করো এবং সম্পূর্ণ অডিট রিপোর্ট দাও!

---

## 📊 আমার অডিট রিপোর্ট (আমি যা খুঁজে পেয়েছি):

### বর্তমান ৩-ডট মেনুতে যা আছে (DynamicHeader.tsx):
| # | অপশন | লোকেশন |
|---|-------|---------|
| 1 | Analytics/Reports | SuperMenu - Book Details only |
| 2 | Share Access | SuperMenu - Book Details only |
| 3 | Export Report | SuperMenu - Book Details only |
| 4 | Edit Ledger | SuperMenu - Book Details only |
| 5 | Delete/Terminate | SuperMenu - Book Details only |

### 📋 সাজেস্টেড ২০+ অপশন (নতুন যোগ করা যেতে পারে):

| # | অপশন | বিবরণ | প্রায়োরিটি | ডিফিকাল্টি |
|---|-------|-------|------------|------------|
| 1 | **Duplicate Entry** | পূর্বের এন্ট্রি কপি করে নতুন তৈরি | High | Easy |
| 2 | **Recurring Transaction** | ধারাবাহিক/রিকারিং পেমেন্ট সেটআপ | High | Medium |
| 3 | **Bulk Delete** | একাধিক এন্ট্রি একসাথে মুছে ফেলা | Medium | Medium |
| 4 | **Entry Status Toggle** | Pending/Completed টগল | High | Easy |
| 5 | **Filter by Date Range** | তারিখ অনুযায়ী ফিল্টার | High | Easy |
| 6 | **Filter by Category** | ক্যাটাগরি অনুযায়ী ফিল্টার | High | Easy |
| 7 | **Search in Book** | বইয়ের মধ্যে সার্চ | High | Easy |
| 8 | **Sort Options** | তারিখ/অ্যামাউন্ট/নাম অনুসারে সাজানো | Medium | Easy |
| 9 | **Pin Book** | বইকে উপরে পিন করা | Medium | Easy |
| 10 | **Change Currency** | কারেন্সি পরিবর্তন | Medium | Easy |
| 11 | **Book Type Change** | General/Customer/Supplier পরিবর্তন | Medium | Easy |
| 12 | **Categories Management** | ক্যাটাগরি যোগ/মুছে ফেলা | Medium | Medium |
| 13 | **Payment Methods** | পেমেন্ট মেথড ম্যানেজমেন্ট | Low | Medium |
| 14 | **Set Reminder** | পেমেন্ট রিমাইন্ডার সেট করা | Medium | Hard |
| 15 | **QR Code Share** | QR কোড দিয়ে শেয়ার | Medium | Medium |
| 16 | **Lock Book** | বুক লক/আনলক | Medium | Medium |
| 17 | **Export Single Entry** | একটি এন্ট্রি এক্সপোর্ট | Low | Easy |
| 18 | **Monthly Summary** | মাসিক সামারি দেখা | Medium | Medium |
| 19 | **Print Entry** | এন্ট্রি প্রিন্ট করা | Low | Easy |
| 20 | **Entry History** | এন্ট্রির পুরোনো ভার্সন ইতিহাস | Low | Hard |
| 21 | **Quick Add Template** | দ্রুত এন্ট্রি টেমপ্লেট | Medium | Medium |
| 22 | **Due Amount Alert** | বকেয়া অ্যালার্ট | Medium | Medium |
| 23 | **Voice Note Entry** | ভয়েস নোট দিয়ে এন্ট্রি | Low | Hard |
| 24 | **Photo Receipt** | রসিদের ছবি যুক্ত করা | Medium | Medium |

---

## 🏆 টপ ৫ মাস্ট হ্যাভ (প্রথমে করা উচিত):

### 1. Duplicate Entry ⭐⭐⭐⭐⭐
- **কাজ:** পূর্বের লেনদেন কপি করে নতুন এন্ট্রি তৈরি
- **লোকেশন:** TransactionTable.tsx - ৩-ডট মেনু বা এন্ট্রি কার্ডে
- **ইমপ্লিমেন্টেশন:** EntryModal-এ pre-fill লজিক

### 2. Filter by Date Range ⭐⭐⭐⭐⭐
- **কাজ:** নির্দিষ্ট তারিখের মধ্যে লেনদেন দেখা
- **লোকেশন:** DetailsToolbar.tsx-এ নতুন ফিল্টার
- **ইমপ্লিমেন্টেশন:** entrySlice-এ dateRange ফিল্টার স্টেট

### 3. Entry Status Toggle ⭐⭐⭐⭐⭐
- **কাজ:** Pending/Completed স্ট্যাটাস পরিবর্তন
- **লোকেশন:** TransactionTable.tsx-এ প্রতিটি এন্ট্রিতে
- **ইমপ্লিমেন্টেশন:** PUT /api/entries endpoint

### 4. Search in Book ⭐⭐⭐⭐
- **কাজ:** বইয়ের সব এন্ট্রিতে সার্চ
- **লোকেশন:** DetailsToolbar.tsx-এ সার্চ বার
- **ইমপ্লিমেন্টেশন:** processedEntries ফিল্টার

### 5. Pin Book ⭐⭐⭐⭐
- **কাজ:** গুরুত্বপূর্ণ বই উপরে পিন করা
- **লোকেশন:** BookCard.tsx বা BooksSection
- **ইমপ্লিমেন্টেশন:** Book model-এ isPinned ফিল্ড

---

## 📁 প্রজেক্ট স্ট্রাকচার রেফারেন্স:

components/
├── Layout/
│   ├── DynamicHeader.tsx (৩-ডট মেনু এখানে)
│   ├── Sidebar.tsx
│   └── DashboardLayout.tsx
├── Sections/
│   ├── Books/
│   │   ├── BookCard.tsx
│   │   ├── BookDetails.tsx
│   │   ├── BooksSection.tsx
│   │   ├── DetailsToolbar.tsx (ফিল্টার/সার্চ)
│   │   └── TransactionTable.tsx (এন্ট্রি লিস্ট)
│   └── ...
├── Modals/
│   ├── EntryModal.tsx
│   ├── BookModal.tsx
│   └── ShareModal.tsx
└── UI/

lib/
├── translations.ts (সব ট্রান্সলেশন কী এখানে)
└── vault/
    └── store/
        ├── slices/
        │   ├── bookSlice.ts
        │   └── entrySlice.ts
        └── storeHelper.ts

models/
├── Book.ts
├── Entry.ts
└── User.ts

app/
└── api/
    ├── books/
    └── entries/

---

## 🔧 কোড রেফারেন্স (বর্তমান ৩-ডট মেনু):

**DynamicHeader.tsx-এর SuperMenu:**
{[
    { label: 'nav_analytics', icon: BarChart3, action: () => openModal('analytics') },
    { label: 'action_share_access', icon: Share2, action: () => openModal('share') },
    { label: 'action_export_report', icon: Download, action: () => openModal('export') },
    { label: 'action_edit_ledger', icon: Edit2, action: () => openModal('editBook') },
].map((item) => ...)}

// Delete button at bottom
<button onClick={() => openModal('deleteConfirm', {...})}>
    <Trash2 /> Terminate Vault
</button>

---

এই মাস্টার প্রম্পটটি ব্যবহার করে আপনি যেকোনো AI-কে দিতে পারেন এবং সে আপনার প্রজেক্টের সম্পূর্ণ অডিট করে উপরের রিপোর্ট দেবে।
