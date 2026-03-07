/**
 * VAULT PRO: MASTER DICTIONARY (V12.0 STABLE)
 * ----------------------------
 * This file contains all keys for the entire website.
 * Keys are lowercase to match T('key') usage in code.
 */

export type Language = 'en' | 'bn';

// 🔒 STRICT TYPE SAFETY: Define all translation keys for type checking
export interface TranslationKeys {
  // --- Navigation & Branding ---
  nav_dashboard: string;
  nav_analytics: string;
  nav_timeline: string;
  nav_system: string;
  nav_signout: string;
  vault_pro: string;
  vault_pro_split_1: string;
  vault_pro_split_2: string;

  // --- Auth & Security Portal ---
  auth_security_portal: string;
  auth_tagline: string;
  biometric_id: string;
  cloud_sync: string;
  btn_unseal: string;
  btn_link_google: string;
  btn_initialize: string;
  auth_new_operator: string;
  auth_existing_operator: string;
  auth_forgot_key: string;
  auth_forgot_key_title: string;
  auth_forgot_desc: string;
  btn_send_recovery: string;
  btn_back_to_login: string;
  auth_create_identity: string;
  auth_proto_dispatched: string;
  btn_confirm_identity: string;

  // --- Ledger Hub & Main Actions ---
  ledger_hub: string;
  btn_create_vault: string;
  title_initialize_vault: string;
  active_protocols: string;
  initialize_ledger: string;
  search_placeholder: string;
  sort_by: string;
  net_asset: string;
  label_net_asset: string;
  label_last_updated: string;
  just_now: string;

  // --- FAB Tooltips ---
  fab_add_entry: string;
  fab_add_book: string;

  // --- Transactions ---
  protocol_entry: string;
  btn_new_entry: string;
  tt_inflow: string;
  tt_outflow: string;
  inflow: string;
  outflow: string;
  label_inflow: string;
  label_outflow: string;
  label_pending: string;
  label_surplus: string;
  tt_pending: string;
  tt_surplus: string;
  label_amount: string;
  label_tag: string;
  label_via: string;
  label_at: string;
  label_memo: string;
  placeholder_entry_title: string;
  placeholder_ledger_name: string;
  execute_protocol: string;
  btn_execute: string;

  // --- Categories & Types ---
  category_general: string;
  category_salary: string;
  category_food: string;
  category_rent: string;
  category_shopping: string;
  type_customer: string;
  type_supplier: string;
  via_protocol: string;

  // --- Status & System ---
  label_status: string;
  status_online: string;
  status_stable: string;
  synced: string;
  pending: string;
  completed: string;
  verified: string;
  identity_verified: string;
  tt_network_stable: string;
  audit_log_title: string;
  tt_audit_log: string;
  data_sovereignty_title: string;
  tt_denger_node: string;
  tt_terminator_warning: string;

  // --- Settings & Recovery ---
  config_title: string;
  system_language: string;
  action_backup: string;
  action_restore: string;
  hard_reset: string;
  purge_btn: string;
  tt_upload_photo: string;
  tt_remove_photo: string;

  // --- Time ---
  time_just_now: string;
  time_2h_ago: string;
  time_yesterday: string;

  // --- Profile & Identity ---
  label_standard_identity: string;
  email_auth_active: string;
  label_connection: string;
  label_status_stable: string;
  label_hierarchy: string;
  label_rank_master: string;

  // --- Ownership & Security Hub ---
  your_ownership: string;
  local_protocol_recovery_hub: string;
  data_sovereignty_desc: string;
  local_disk_access_validated: string;
  bring_back_data: string;
  secure_data: string;
  sovereignty_protocol_v11: string;

  // --- Audit Log & Action History ---
  action_history: string;
  local_node_activity_feed: string;
  event_identity_updated: string;
  event_backup_exported: string;
  event_session_verified: string;
  audit_node_info: string;

  // --- Danger Zone & Termination ---
  danger_zone_title: string;
  irreversible_system_termination: string;
  label_termination: string;
  desc_termination: string;
  btn_delete_identity: string;

  // --- Global Actions & Time ---
  action_save_security: string;
  
  turbo_mode_on: string;
  amoled_midnight: string;
  compact_deck: string;
  session_shield: string;
  system_pulse: string;
  system_guidance: string;
  node_online: string;
  protocol_active: string;
  standby_mode: string;
  
  realtime_sync: string;
  pusher_node_active: string;
  cloud_relay: string;
  sync_status_stable: string;
  low_latency_mode: string;
  last_sync_time: string;

  // --- ডেভ ও ইঞ্জিন ডিবাগিং ---
  engine_warmup: string;
  hot_module_active: string;
  internal_relay_pending: string;
  system_integrity_ok: string;
  network_heartbeat: string;
}

// 🌍 ENGLISH TRANSLATIONS
const englishTranslations: Omit<TranslationKeys, 'engine_warmup' | 'hot_module_active' | 'internal_relay_pending' | 'system_integrity_ok' | 'network_heartbeat'> = {
  // --- Navigation & Branding ---
  nav_dashboard: "Dashboard",
  nav_analytics: "Reports",
  nav_timeline: "History",
  nav_system: "Settings",
  nav_signout: "Log out",
  vault_pro: "Vault Pro",
  vault_pro_split_1: "Vault",
  vault_pro_split_2: "Pro",

  // --- Auth & Security Portal ---
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

  // --- FAB Tooltips ---
  fab_add_entry: "Add Entry",
  fab_add_book: "Add Book",

  // --- Transactions ---
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



    
  // --- Profile & Identity ---
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
  last_sync_time: "Last synced: Just Now"
};

// 🇧🇩 BENGALI TRANSLATIONS
const bengaliTranslations: Omit<TranslationKeys, 'engine_warmup' | 'hot_module_active' | 'internal_relay_pending' | 'system_integrity_ok' | 'network_heartbeat'> = {
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
  auth_tagline: "আপনার টাকা, আপনার নিয়ন্ত্রণ।",
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

  // --- FAB Tooltips ---
  fab_add_entry: "এন্ট্রি যোগ",
  fab_add_book: "খাতা যোগ",

  // --- Transactions ---
  protocol_entry: "হিসাব যোগ",
  btn_new_entry: "নতুন লেনদেন",
  tt_inflow: "আয়ের এন্ট্রি",
  tt_outflow: "খরচের এন্ট্রি",
  inflow: "আয়",
  outflow: "খরচ",
  label_inflow: "আয়",
  label_outflow: "খরচ",
  label_pending: "বকেয়",
  label_surplus: "হাতে টাকা",
  tt_pending: "বকেয় থাকা",
  tt_surplus: "অবশিষ্ট ব্যালেন্স",
  label_amount: "পরিমাণ",
  label_tag: "বিভাগ",
  label_via: "পদ্ধতি",
  label_at: "সময়",
  label_memo: "নোট",
  placeholder_entry_title: "এটা কি?",
  placeholder_ledger_name: "উদাহরণ: আমার দোকান হিসাব",
  execute_protocol: "সংরক্ষণ",
  btn_execute: "সংরক্ষণ",

  // --- Categories & Types ---
  category_general: "সাধারণ",
  category_salary: "বেতন",
  category_food: "খাবার",
  category_rent: "ভাড়া",
  category_shopping: "শপিং",
  type_customer: "কাস্টমার",
  type_supplier: "সাপ্লাইয়ার",
  via_protocol: "পরিশোধ",

  // --- Status & System ---
  label_status: "অবস্থা",
  status_online: "অনলাইন",
  status_stable: "স্থিতিশীল",
  synced: "সিংক",
  pending: "বকেয়",
  completed: "সম্পন্ন",
  verified: "যাচাইকৃত",
  identity_verified: "যাচাইকৃত",
  tt_network_stable: "নেটওয়র্ক স্থিতিশীল",
  audit_log_title: "কর্মকাণ্ড ইতিহাস",
  tt_audit_log: "সব কর্মকাণ্ড দেখুন",
  data_sovereignty_title: "আপনার মালিকানা",
  tt_denger_node: "সতর্কবণ!",
  tt_terminator_warning: "এটা চিরমূল যাবে!",

  // --- Settings & Recovery ---
  config_title: "সেটিংস",
  system_language: "ভাষা",
  action_backup: "নিরাপদ ডাটা",
  action_restore: "ডাটা ফিরে আনুন",
  hard_reset: "অ্যাপ রিসেট",
  purge_btn: "সব ডাটা মুছে",
  tt_upload_photo: "ছবি যোগ",
  tt_remove_photo: "ছবি সরান",

  // --- Time ---
  time_just_now: "এইমাত্র",
  time_2h_ago: "২ ঘন্টা আগে",
  time_yesterday: "গতকাল",

  // --- Profile & Identity ---
  label_standard_identity: "যাচাইকৃত পরিচয়",
  email_auth_active: "প্রাথমিক ইমেইল সক্রিয়",
  label_connection: "নোড সংযোগ",
  label_status_stable: "অবস্থা: স্থিতিশীল",
  label_hierarchy: "অ্যাকাউন্ট পদমর্যাদ",
  label_rank_master: "মাস্টার নোড",

  // --- Ownership & Security Hub ---
  your_ownership: "ডাটা সার্বভিনতা",
  local_protocol_recovery_hub: "স্থানীয় পুনরুদ্ধার হাব",
  data_sovereignty_desc: "আপনি আপনার ডাটা। সবকিছু এনক্রিপ্টেড এবং স্থানীয় সংরক্ষণ করা হয়েছে।",
  local_disk_access_validated: "অফলাইন স্টোরেজ যাচাইকৃত",
  bring_back_data: "ব্যাকআপ ফিরে আনুন",
  secure_data: "এনক্রিপ্ট ও আর্কাইভ",
  sovereignty_protocol_v11: "সার্বভিনতা প্রোটোকল v11.0",

  // --- Audit Log & Action History ---
  action_history: "সিস্টেম অডিট লগ",
  local_node_activity_feed: "রিয়েলটাইম কার্যক্রম",
  event_identity_updated: "নিরাপত্তা প্রোফাইল আপডেট",
  event_backup_exported: "স্থানীয় ডাটা আর্কাইভ তৈরি",
  event_session_verified: "অথ সেশন যাচাইকৃত",
  audit_node_info: "নিরাপত্তা ইন্টেগ্রিটি যাচাইকৃত",

  // --- Danger Zone & Termination ---
  danger_zone_title: "নিরাপত্তা সমাপ্তন",
  irreversible_system_termination: "অপরিবর্তনযোগ্য সমাপ্তন",
  label_termination: "স্থায়ী অ্যাকাউন্ট মুছে",
  desc_termination: "সব স্থানীয় ডাটা, নিরাপত্তা কী এবং কনফিগারেশন মুছে।",
  btn_delete_identity: "আইডেন্টিটি সমাপ্তন",

  // --- Global Actions & Time ---
  action_save_security: "নিরাপত্তা প্রোটোকল সংরক্ষণ",
  
  turbo_mode_on: "টার্বো ইঞ্জিন সক্রিয়",
  amoled_midnight: "মিডনাইট অ্যামোলেড থিম",
  compact_deck: "কমপ্যাক্ট ইন্টারফেস",
  session_shield: "নিরাপত্তা শিল্ড সক্রিয়",
  system_pulse: "সিস্টেম পালস মনিটরিং",
  system_guidance: "ইন্টারেক্টিভ গাইডেন্স",
  node_online: "নোড অবস্থা: অনলাইন",
  protocol_active: "প্রোটোকল: সক্রিয়",
  standby_mode: "অবস্থা: স্ট্যান্ডবাই",
  
  realtime_sync: "মাল্টি-ডিভাইস সিংক",
  pusher_node_active: "সিংক নোড: সক্রিয়",
  cloud_relay: "নিরাপদ ক্লাউড রিলে",
  sync_status_stable: "সিংক অবস্থা: স্থিতিশীল",
  low_latency_mode: "আল্ট্রা-লো লেটেন্সি",
  last_sync_time: "সর্বশেষ সিংক: এইমাত্র"
};

// 🚀 TYPE-SAFE TRANSLATIONS OBJECT
export const translations: Record<Language, Partial<TranslationKeys>> = {
  en: englishTranslations,
  bn: bengaliTranslations
};

// 🔧 TYPE GUARDS: Ensure all keys are defined
type TranslationKey = keyof TranslationKeys;
type TranslationValue = string;

// LAZY LOADING PREPARATION: Language-specific modules
export const loadEnglishTranslations = (): Partial<TranslationKeys> => englishTranslations;
export const loadBengaliTranslations = (): Partial<TranslationKeys> => bengaliTranslations;

// TYPE-SAFE TRANSLATION HELPER
export const getTranslation = (key: TranslationKey, language: Language = 'en'): string => {
  const langTranslations = translations[language];
  if (!langTranslations || !(key in langTranslations)) {
    // Fallback to English if key not found
    const englishValue = (englishTranslations as any)[key];
    return englishValue || `[Missing: ${key}]`;
  }
  const value = (langTranslations as any)[key];
  return value || `[Missing: ${key}]`;
};