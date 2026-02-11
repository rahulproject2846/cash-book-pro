/**
 * VAULT PRO: MASTER DICTIONARY (V12.0 STABLE)
 * ----------------------------
 * This file contains all keys for the entire website.
 * Keys are lowercase to match T('key') usage in code.
 */

export type Language = 'en' | 'bn';

export const translations: any = {
  en: {
    // --- Navigation & Branding ---
    nav_dashboard: "Dashboard",
    nav_analytics: "Reports",
    nav_timeline: "History",
    nav_system: "Settings",
    nav_signout: "Log out",
    vault_pro: "Vault Pro",
    vault_pro_split_1: "Vault",
    vault_pro_split_2: "Pro",

    // --- Auth & Security Portal (Matching your AuthScreen) ---
    auth_security_portal: "Security Center",
    auth_tagline: "Your money, your control.",
    biometric_id: "Fingerprint / Face",
    cloud_sync: "Online Backup",
    btn_unseal: "Unlock",
    btn_link_google: "Link Google",
    btn_initialize: "Get Started",
    auth_new_operator: "New User? Register",
    auth_existing_operator: "Have an account? Login",
    auth_forgot_key: "Forgot Password?",
    auth_forgot_key_title: "Recover Account",
    auth_forgot_desc: "We will send a code to your email",
    btn_send_recovery: "Send Code",
    btn_back_to_login: "Back to Login",
    auth_create_identity: "Create New Account",
    auth_proto_dispatched: "Code Sent Successfully",
    btn_confirm_identity: "Confirm & Finish",

    // --- Ledger Hub & Main Actions ---
    ledger_hub: "Ledger Hub",
    btn_create_vault: "New Book",
    title_initialize_vault: "Start New Book",
    active_protocols: "Active Ledgers",
    initialize_ledger: "Start New Ledger",
    search_placeholder: "Search...",
    sort_by: "Sort by",
    net_asset: "Total Cash",
    label_net_asset: "Total Balance",
    label_last_updated: "Last Updated",
    just_now: "Just now",

    // --- Transactions (Short & Clear) ---
    protocol_entry: "Add Entry",
    btn_new_entry: "New Transaction",
    tt_inflow: "Income Entry",
    tt_outflow: "Expense Entry",
    inflow: "Income",
    outflow: "Expense",
    label_inflow: "Income",
    label_outflow: "Expense",
    label_pending: "Due",
    label_surplus: "Cash in Hand",
    tt_pending: "Pending Amount",
    tt_surplus: "Remaining Balance",
    label_amount: "Amount",
    label_tag: "Category",
    label_via: "Method",
    label_at: "Time",
    label_memo: "Note",
    placeholder_entry_title: "What is this for?",
    placeholder_ledger_name: "Ex: My Shop Ledger",
    execute_protocol: "Save",
    btn_execute: "Save",

    // --- Categories & Types ---
    category_general: "General",
    category_salary: "Salary",
    category_food: "Food",
    category_rent: "Rent",
    category_shopping: "Shopping",
    type_customer: "Customer",
    type_supplier: "Supplier",
    via_protocol: "Paid Via",

    // --- Status & System ---
    label_status: "Status",
    status_online: "Online",
    status_stable: "Stable",
    synced: "Synced",
    pending: "Pending",
    completed: "Completed",
    verified: "Verified",
    identity_verified: "Verified",
    tt_network_stable: "Network Stable",
    audit_log_title: "Action History",
    tt_audit_log: "View All Actions",
    data_sovereignty_title: "Your Ownership",
    tt_denger_node: "Warning!",
    tt_terminator_warning: "It'll be gone forever!",

    // --- Settings & Recovery ---
    config_title: "Settings",
    system_language: "Language",
    action_backup: "Secure Data",
    action_restore: "Bring Back Data",
    hard_reset: "Reset App",
    purge_btn: "Delete All Data",
    tt_upload_photo: "Add Photo",
    tt_remove_photo: "Remove Photo",

    // --- Time ---
    time_just_now: "Just now",
    time_2h_ago: "2 hours ago",
    time_yesterday: "Yesterday",
    

    // --- Profile & Identity Section ---
label_standard_identity: "Verified Identity",
email_auth_active: "Primary Email Active",
label_connection: "Node Connection",
label_status_stable: "Status: Stable",
label_hierarchy: "Account Rank",
label_rank_master: "Master Node",

// --- Ownership & Security Hub ---
your_ownership: "Data Sovereignty",
local_protocol_recovery_hub: "Local Recovery Hub",
data_sovereignty_desc: "You own your data. Everything is encrypted and stored locally.",
local_disk_access_validated: "Offline Storage Verified",
bring_back_data: "Restore Backup",
secure_data: "Encrypt & Archive",
sovereignty_protocol_v11: "Sovereignty Protocol v11.0",

// --- Audit Log & Action History ---
action_history: "System Audit Log",
local_node_activity_feed: "Real-time Activity Feed",
event_identity_updated: "Security Profile Updated",
event_backup_exported: "Local Data Archive Created",
event_session_verified: "Auth Session Verified",
audit_node_info: "Security Integrity Validated",

// --- Danger Zone & Termination ---
danger_zone_title: "Security Termination",
irreversible_system_termination: "Irreversible Termination",
label_termination: "Permanent Account Deletion",
desc_termination: "Wipe all local data, security keys, and configurations.",
btn_delete_identity: "Terminate Identity",

// --- Global Actions & Time ---
action_save_security: "Save Security Protocol",


turbo_mode_on: "Turbo Engine Active",
amoled_midnight: "Midnight AMOLED Theme",
compact_deck: "Compact Interface",
session_shield: "Security Shield Active",
system_pulse: "System Pulse Monitoring",
system_guidance: "Interactive Guidance",
node_online: "Node Status: Online",
protocol_active: "Protocol: Active",
standby_mode: "Status: Standby",


realtime_sync: "Multi-Device Sync",
pusher_node_active: "Sync Node: Active",
cloud_relay: "Secure Cloud Relay",
sync_status_stable: "Sync Status: Stable",
low_latency_mode: "Ultra-Low Latency",
last_sync_time: "Last synced: Just Now",




// --- ডেভ ও ইঞ্জিন ডিবাগিং ---
engine_warmup: "ইঞ্জিন ওয়ার্ম-আপ শুরু হচ্ছে",
hot_module_active: "অটো-রিফ্রেশ: সক্রিয়",
internal_relay_pending: "ইন্টারনাল রিলে: অপেক্ষমাণ",
system_integrity_ok: "কোর ইনটেগ্রিটি: যাচাইকৃত",
network_heartbeat: "হার্টবিট: স্থিতিশীল",


  },

  bn: {
    // --- Navigation & Branding ---
    nav_dashboard: "ড্যাশবোর্ড",
    nav_analytics: "রিপোর্ট",
    nav_timeline: "ইতিহাস",
    nav_system: "সেটিংস",
    nav_signout: "লগআউট",
    vault_pro: "ভল্ট প্রো",
    vault_pro_split_1: "ভল্ট",
    vault_pro_split_2: "প্রো",

    // --- Auth & Security Portal ---
    auth_security_portal: "নিরাপত্তা কেন্দ্র",
    auth_tagline: "আপনার টাকা, আপনার নিয়ন্ত্রণ।",
    biometric_id: "আঙুলের ছাপ / ফেস লক",
    cloud_sync: "অনলাইন ব্যাকআপ",
    btn_unseal: "লক খুলুন",
    btn_link_google: "গুগল দিয়ে যুক্ত করুন",
    btn_initialize: "শুরু করুন",
    auth_new_operator: "নতুন ইউজার? রেজিস্ট্রেশন",
    auth_existing_operator: "অ্যাকাউন্ট আছে? লগইন",
    auth_forgot_key: "পাসওয়ার্ড ভুলে গেছেন?",
    auth_forgot_key_title: "অ্যাকাউন্ট ফেরত আনুন",
    auth_forgot_desc: "আমরা আপনার ইমেইলে একটি কোড পাঠাবো",
    btn_send_recovery: "কোড পাঠান",
    btn_back_to_login: "লগইন-এ ফিরে যান",
    auth_create_identity: "নতুন অ্যাকাউন্ট খুলুন",
    auth_proto_dispatched: "কোড পাঠানো হয়েছে",
    btn_confirm_identity: "নিশ্চিত করুন",

    // --- Ledger Hub & Main Actions ---
    ledger_hub: "হিসাব খাতা",
    btn_create_vault: "নতুন খাতা",
    title_initialize_vault: "নতুন খাতা শুরু",
    active_protocols: "চলমান খাতা",
    initialize_ledger: "নতুন লেজার শুরু",
    search_placeholder: "খুঁজুন...",
    sort_by: "সাজান",
    net_asset: "মোট জমা",
    label_net_asset: "মোট ব্যালেন্স",
    label_last_updated: "সর্বশেষ আপডেট",
    just_now: "এইমাত্র",

    // --- Transactions ---
    protocol_entry: "হিসাব যোগ",
    btn_new_entry: "নতুন লেনদেন",
    tt_inflow: "আয়ের এন্ট্রি",
    tt_outflow: "খরচের এন্ট্রি",
    inflow: "আয়",
    outflow: "ব্যয়",
    label_inflow: "আয়",
    label_outflow: "খরচ",
    label_pending: "বাকি",
    label_surplus: "কাছে আছে",
    tt_pending: "বাকি টাকা",
    tt_surplus: "অবশিষ্ট জমা",
    label_amount: "পরিমাণ",
    label_tag: "ক্যাটাগরি",
    label_via: "মাধ্যম",
    label_at: "সময়",
    label_memo: "নোট",
    placeholder_entry_title: "টাকাটা কিসের জন্য?",
    placeholder_ledger_name: "উদাঃ দোকানের খাতা",
    execute_protocol: "সেভ করুন",
    btn_execute: "সেভ",

    // --- Categories & Types ---
    category_general: "সাধারণ",
    category_salary: "বেতন",
    category_food: "খাবার",
    category_rent: "ভাড়া",
    category_shopping: "কেনাকাটা",
    type_customer: "কাস্টমার",
    type_supplier: "সাপ্লায়ার",
    via_protocol: "মাধ্যম",

    // --- Status & System ---
    label_status: "অবস্থা",
    status_online: "অনলাইন",
    status_stable: "স্থিতিশীল",
    synced: "সিঙ্ক হয়েছে",
    pending: "বাকি আছে",
    completed: "সম্পন্ন",
    verified: "যাচাইকৃত",
    identity_verified: "পরিচয় নিশ্চিত",
    tt_network_stable: "নেটওয়ার্ক সচল",
    audit_log_title: "কাজের ইতিহাস",
    tt_audit_log: "সব কাজ দেখুন",
    data_sovereignty_title: "আপনার মালিকানা",
    tt_denger_node: "বিপদ!",
    tt_terminator_warning: "সব মুছে যাবে!",

    // --- Settings & Recovery ---
    config_title: "সেটিংস",
    system_language: "ভাষা",
    action_backup: "ডাটা সেভ",
    action_restore: "ডাটা ফেরত আনা",
    hard_reset: "রিসেট করুন",
    purge_btn: "সব ডাটা মুছুন",
    tt_upload_photo: "ছবি দিন",
    tt_remove_photo: "ছবি মুছুন",

    // --- Time ---
    time_just_now: "এইমাত্র",
    time_2h_ago: "২ ঘণ্টা আগে",
    time_yesterday: "গতকাল",
    // --- প্রোফাইল ও আইডেন্টিটি সেকশন ---
label_standard_identity: "যাচাইকৃত প্রোফাইল",
email_auth_active: "প্রধান ইমেইল সক্রিয়",
label_connection: "নেটওয়ার্ক সংযোগ",
label_status_stable: "অবস্থা: স্থিতিশীল",
label_hierarchy: "অ্যাকাউন্টের স্তর",
label_rank_master: "মাস্টার নোড",

// --- ওনারশিপ ও সিকিউরিটি হাব ---
your_ownership: "তথ্যের সার্বভৌমত্ব",
local_protocol_recovery_hub: "লোকাল রিকভারি হাব",
data_sovereignty_desc: "আপনার তথ্যের মালিক আপনি। সবকিছু লোকালি এনক্রিপ্ট করে রাখা হয়েছে।",
local_disk_access_validated: "অফলাইন স্টোরেজ যাচাইকৃত",
bring_back_data: "ব্যাকআপ পুনরুদ্ধার",
secure_data: "এনক্রিপ্ট ও আর্কাইভ",
sovereignty_protocol_v11: "সার্ভভৌমত্ব প্রোটোকল v১১.০",

// --- অডিট লগ ও অ্যাকশন হিস্ট্রি ---
action_history: "সিস্টেম অডিট লগ",
local_node_activity_feed: "রিয়েল-টাইম অ্যাক্টিভিটি ফিড",
event_identity_updated: "নিরাপত্তা প্রোফাইল আপডেট",
event_backup_exported: "লোকাল ডেটা আর্কাইভ তৈরি",
event_session_verified: "সেশন ভেরিফিকেশন সফল",
audit_node_info: "নিরাপত্তা ইনটেগ্রিটি যাচাইকৃত",

// --- ডেঞ্জার জোন ও টার্মিনেশন ---
danger_zone_title: "সংবেদনশীল কার্যক্রম",
irreversible_system_termination: "অপরিবর্তনীয় সমাপ্তি প্রক্রিয়া",
label_termination: "অ্যাকাউন্ট স্থায়ীভাবে অপসারণ",
desc_termination: "সকল লোকাল তথ্য, সিকিউরিটি কি এবং কনফিগারেশন মুছে ফেলুন।",
btn_delete_identity: "আইডেন্টিটি মুছে ফেলুন",

// --- গ্লোবাল অ্যাকশন ও সময় ---
action_save_security: "নিরাপত্তা প্রোটোকল সেভ করুন",

turbo_mode_on: "টার্বো ইঞ্জিন সক্রিয়",
amoled_midnight: "মিডনাইট অ্যামোলেড থিম",
compact_deck: "কমপ্যাক্ট ইন্টারফেস",
session_shield: "নিরাপত্তা শিল্ড সক্রিয়",
system_pulse: "সিস্টেম পালস মনিটরিং",
system_guidance: "ইন্টারঅ্যাক্টিভ গাইডেন্স",
node_online: "নোড স্ট্যাটাস: অনলাইন",
protocol_active: "প্রোটোকল: সক্রিয়",
standby_mode: "অবস্থা: স্ট্যান্ডবাই",


// --- রিয়েল-টাইম সিঙ্ক ও ইঞ্জিন ---
realtime_sync: "মাল্টি-ডিভাইস সিঙ্ক",
pusher_node_active: "সিঙ্ক নোড: সক্রিয়",
cloud_relay: "সুরক্ষিত ক্লাউড রিলে",
sync_status_stable: "সিঙ্ক অবস্থা: স্থিতিশীল",
low_latency_mode: "আল্ট্রা-লো ল্যাটেন্সি",
last_sync_time: "সর্বশেষ সিঙ্ক: এইমাত্র",

// --- ডেভ ও ইঞ্জিন ডিবাগিং ---
engine_warmup: "ইঞ্জিন ওয়ার্ম-আপ শুরু হচ্ছে",
hot_module_active: "অটো-রিফ্রেশ: সক্রিয়",
internal_relay_pending: "ইন্টারনাল রিলে: অপেক্ষমাণ",
system_integrity_ok: "কোর ইনটেগ্রিটি: যাচাইকৃত",
network_heartbeat: "হার্টবিট: স্থিতিশীল",




    
  }
  
};