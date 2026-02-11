/**
 * VAULT PRO: GLOBAL DICTIONARY (V12.0 STABLE)
 * ----------------------------
 * এখানে সব কি (Key) ছোট হাতের (lowercase) রাখা হয়েছে।
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

  // --- Ledger Hub (Main Page) ---
  ledger_hub: "Ledger Hub",
  active_protocols: "Active Ledgers",
  initialize_ledger: "Start New Ledger",
  search_placeholder: "Search...",
  sort_by: "Sort by",
  label_net_asset: "Total Balance",
  label_last_updated: "Last Updated",
  just_now: "Just now",
  status_new: "New",
  sync_ready: "Ready to Sync",

  // --- Entry / Transaction ---
  protocol_entry: "Add Transaction",
  inflow: "Income",
  outflow: "Expense",
  label_inflow: "Income",
  label_outflow: "Expense",
  label_pending: "Pending",
  label_surplus: "Remaining",
  identity_label: "Account",
  memo_label: "Note",
  execute_protocol: "Save",
  btn_new_entry: "New Transaction",
  btn_execute: "Save",
  btn_upgrade: "Update",
  placeholder_entry_title: "What is this for?",
  placeholder_entry_memo: "Additional details (optional)",
  label_protocol: "Description",
  label_amount: "Amount",
  label_tag: "Category",
  label_via: "Method",
  label_at: "Time",

  // --- Status & Security ---
  synced: "Synced",
  pending: "Pending",
  completed: "Completed",
  verified: "Verified",
  protocol_secured: "Data secured",
  core_status: "System Status",
  system_active: "System Active",
  protocol_active: "Ledger Active",
  status_online: "Online",
  status_offline: "Offline",
  status_stable: "Stable",
  rank_master: "Master",
  session_shield: "Session Protection",
  protocol_locked: "Locked — verification required",

  // --- Settings / Governance ---
  config_title: "System Settings",
  governance: "Controls",
  registry_tags: "Categories",
  expense_threshold: "Expense Limit",
  base_currency: "Base Currency",
  interface_engine: "Interface Settings",
  amoled_midnight: "Dark Mode",
  compact_deck: "Compact View",
  system_pulse: "System Activity",
  activity_brief: "Activity Summary",
  hardware_health: "Device Health",
  storage_weight: "Storage Usage",
  local_registry: "Local Data",
  hard_reset: "Reset App",
  purge_cache: "Clear Cache",
  regional_protocol: "Regional Settings",
  system_language: "Language",
  system_version: "Version 12.0 (Stable)",
  data_weight: "Data Size",
  recovery_protocol: "Data Recovery",
  recovery_desc: "Generate a secure code to recover your data",
  generate_key: "Generate Recovery Code",
  purge_desc: "All local data will be permanently deleted",
  purge_btn: "Delete All Data",

  // --- Identity & Profile ---
  identity_hub_title: "Account",
  master_profile_protocol: "Profile Details",
  google_verified: "Google Verified",
  identity_secured: "Account Secured",
  standard_identity: "Vault ID",
  email_auth_active: "Email Protection Active",
  label_connection: "Connection",
  label_hierarchy: "Role",
  danger_zone_title: "Danger Zone",
  label_termination: "Delete Account",
  desc_termination: "All cloud and local data will be removed",
  btn_delete_identity: "Delete Account",
  critical_auth: "Security Check",
  warn_ledger_loss: "All ledgers will be deleted",
  warn_backup_loss: "All backups will be lost",
  warn_irreversible: "This action cannot be undone",
  label_type_email: "Type your email to confirm",
  security_protocol_title: "Security Settings",
  identity_name_label: "Name",
  current_key_label: "Current Password",
  new_key_label: "New Password",
  action_save_security: "Save Changes",

  // --- Analytics & Reports ---
  analytics_intelligence: "Financial Reports",
  flow_velocity: "Income vs Expense Trend",
  capital_split: "Money Breakdown",
  liquidity_protocol: "Cash Flow",
  total_expense: "Total Expense",
  awaiting_intel: "No data available",
  cash_archive: "Cash",
  bank_archive: "Bank",
  export_title: "Download Data",
  btn_extract: "Download",

  // --- Sorting ---
  sort_date: "By Date",
  sort_amount: "By Amount",
  sort_title: "By Title",
  sort_activity: "By Activity",
  sort_name: "By Name",
  sort_balance_high: "Balance: High to Low",
  sort_balance_low: "Balance: Low to High",

  // --- Tooltips (tt_) ---
  tt_add_entry: "Add a new transaction",
  tt_analytics: "View reports",
  tt_export: "Download your data",
  tt_midnight: "Enable dark mode",
  tt_shield: "Session protection enabled",
  tt_back_dashboard: "Back to dashboard",
  tt_toggle_theme: "Change theme",
  tt_more_options: "More settings",
  tt_edit_record: "Edit transaction",
  tt_delete_record: "Delete transaction",
  tt_change_status: "Change status",
  tt_purge_warning: "Warning: all data will be deleted",
  tt_restore: "Restore from backup",
  tt_backup: "Download backup",

  // --- Messages & Toast ---
  success_entry_secured: "Transaction saved successfully",
  err_protocol_sync: "No internet — saved locally",
  success_entry_terminated: "Transaction deleted",
  err_termination_failed: "Unable to delete",
  btn_undo: "Undo",



  
  BTN_CREATE_VAULT: "Create Vault",
  TT_ACCOUNT_SETTING: "Account settings",

  NET_ASSET: "Net Balance",

  TT_CHANGE_SORT_ORDER: "Change sort order",
  TT_IMPORT_LEDGER: "Import ledger",

  TT_INFLOW: "Income entry",
  TT_OUTFLOW: "Expense entry",
  TT_PENDING: "Pending amount",
  TT_SURPLUS: "Remaining balance",

  TT_FILTER_VATEGORY: "Filter by category",
  TT_FILTER_BY: "Filter records",
  TT_FILTER_BY_FILTER_TYPE: "Select filter type",

  LABEL_DATE: "Date",
  LABEL_TIME: "Time",
  LABEL_REF_ID: "Reference ID",
  LABEL_MEMO: "Note",
  LABEL_STATUS: "Status",
  LABEL_OPTIONS: "Options",

  TT_TOGGLE_STATUS: "Change status",

  PROTOCOL_ARCHIVE: "Archive",
  RECORDS_ANALYZED: "Records analyzed",
  RECORDS_FOUND: "Records found",

  DESC_INFLOW: "Money coming in",
  DESC_OUTFLOW: "Money going out",
  DESC_PENDING: "Amount not yet completed",
  DESC_SURPLUS: "Extra remaining amount",

  EXECUTE_REPORT_TITLE: "Generate Report",
  execute_report_desc: "Create a summary report from selected data",
  BTN_EXECUTE_ARCHIVE: "Archive Now",

  PROTOCOL_INDEX: "Ledger Index",
  GOVERNANCE_ACTIVE: "Governance Active",
  NODE_ONLINE: "Node Online",

  PLACEHOLDER_NEW_TAG: "Enter new category",
  LABEL_MONTHLY_CAP: "Monthly Limit",
  TITLE_INITIALIZE_VAULT: "Initialize New Vault",

  LABEL_VISUAL_ID: "Visual ID",
  placeholder_ledger_name: "Ledger name",
  placeholder_vault_memo: "Vault note (optional)",

  type_general: "General",
  type_customer: "Customer",
  type_supplier: "Supplier",

  VIA_PROTOCOL: "Via",

  category_general: "General",
  category_amount: "Amount",
  category_title: "Title",
  category_all: "All",
  category_salary: "Salary",
  category_food: "Food",
  category_rent: "Rent",
  category_shopping: "Shopping",
  category_date: "Date",
  category_income: "Income",
  category_expense: "Expense",

  ACTION_ACCOUNT_SETTINGS: "Account Settings",

  LABEL_INTEGRITY: "Data Integrity",
  TT_UPLOAD_PHOTO: "Upload photo",
  TT_REMOVE_PHOTO: "Remove photo",
  TT_VAULT_AUTH: "Vault authentication",

  LABEL_STANDARD_IDENTITY: "Standard Identity",
  TT_NETWORK_STABLE: "Network stable",
  LABEL_RANK_MASTER: "Master Rank",

  DATA_SOVEREIGNTY_TITLE: "Data Sovereignty",
  data_sovereignty_desc: "You have full control over your data",

  TT_ARCHIVE_STATUS: "Archive status",

  ACTION_BACKUP: "Backup",
  ACTION_RESTORE: "Restore",

  AUDIT_LOG_TITLE: "Audit Log",
  TT_AUDIT_LOG: "View audit log",
  TT_MONITOROING: "System monitoring",

  TT_EVENT_IDENTITY: "Identity event",
  TT_EVENT_BACKUP: "Backup event",
  TT_EVENT_SESSION: "Session event",

  time_just_now: "Just now",
  time_2h_ago: "2 hours ago",
  time_yesterday: "Yesterday",

  event_identity_updated: "Identity updated",
  event_backup_exported: "Backup exported",
  event_session_verified: "Session verified",

  audit_node_info: "Node activity details",

  TT_SOVEREIGNTY_DESC: "Your data stays under your control",
  TT_RESTORE_IDENTITY: "Restore identity",
  TT_BACKUP_IDENTITY: "Backup identity",

  TT_DENGER_NODE: "Warning: risky operation",
  TT_TERMINATOR_WARNING: "This action is irreversible",

  IDENTITY_VERIFIED: "Identity verified",


  health_score_label: "Financial Health Score",
    turbo_mode_on: "Turbo Mode: Active",
    account_suspended: "Account Suspended",

    // Warning & Alerts
    duplicate_warning: "Caution: A similar entry was added recently!",
    sync_error: "Sync failed. Retrying in background...",
    network_offline: "Offline Mode: Changes will sync later",
    
    // Actions
    save: "Save",
    cancel: "Cancel",
    undo: "Undo",
    delete: "Delete",
    restore: "Restore",

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

  // --- Ledger Hub (Main Page) ---
  ledger_hub: "লেজার হাব",
  active_protocols: "চলমান লেজার",
  initialize_ledger: "নতুন লেজার শুরু করুন",
  search_placeholder: "খুঁজুন...",
  sort_by: "সাজান",
  label_net_asset: "মোট ব্যালেন্স",
  label_last_updated: "সর্বশেষ আপডেট",
  just_now: "এইমাত্র",
  status_new: "নতুন",
  sync_ready: "সিঙ্কের জন্য প্রস্তুত",

  // --- Entry / Transaction ---
  protocol_entry: "লেনদেন যোগ",
  inflow: "আয়",
  outflow: "ব্যয়",
  label_inflow: "আয়",
  label_outflow: "খরচ",
  label_pending: "অপেক্ষায়",
  label_surplus: "অবশিষ্ট",
  identity_label: "অ্যাকাউন্ট",
  memo_label: "নোট",
  execute_protocol: "সংরক্ষণ করুন",
  btn_new_entry: "নতুন লেনদেন",
  btn_execute: "সেভ করুন",
  btn_upgrade: "আপডেট করুন",
  placeholder_entry_title: "এই টাকাটা কিসের জন্য?",
  placeholder_entry_memo: "অতিরিক্ত তথ্য (ঐচ্ছিক)",
  label_protocol: "বিবরণ",
  label_amount: "পরিমাণ",
  label_tag: "ক্যাটাগরি",
  label_via: "মাধ্যম",
  label_at: "সময়",

  // --- Status & Security ---
  synced: "সিঙ্ক হয়েছে",
  pending: "বাকি আছে",
  completed: "সম্পন্ন",
  verified: "নিশ্চিত",
  protocol_secured: "ডাটা নিরাপদ",
  core_status: "সিস্টেম অবস্থা",
  system_active: "সিস্টেম চালু",
  protocol_active: "লেজার চালু",
  status_online: "অনলাইন",
  status_offline: "অফলাইন",
  status_stable: "স্থিতিশীল",
  rank_master: "মাস্টার",
  session_shield: "সেশন সুরক্ষা",
  protocol_locked: "লক করা আছে — যাচাই প্রয়োজন",

  // --- Settings / Governance ---
  config_title: "সিস্টেম সেটিংস",
  governance: "নিয়ন্ত্রণ",
  registry_tags: "ক্যাটাগরি তালিকা",
  expense_threshold: "খরচ সীমা",
  base_currency: "প্রধান মুদ্রা",
  interface_engine: "ইন্টারফেস সেটিংস",
  amoled_midnight: "ডার্ক মোড",
  compact_deck: "কমপ্যাক্ট ভিউ",
  system_pulse: "সিস্টেম অ্যাক্টিভিটি",
  activity_brief: "সংক্ষিপ্ত হিসাব",
  hardware_health: "ডিভাইস অবস্থা",
  storage_weight: "স্টোরেজ ব্যবহার",
  local_registry: "লোকাল ডাটা",
  hard_reset: "রিসেট করুন",
  purge_cache: "ক্যাশ পরিষ্কার",
  regional_protocol: "লোকাল সেটিংস",
  system_language: "ভাষা",
  system_version: "ভার্সন ১২.০ (স্টেবল)",
  data_weight: "ডাটার সাইজ",
  recovery_protocol: "ডাটা রিকভারি",
  recovery_desc: "ডাটা ফেরত আনার জন্য সিকিউর কোড তৈরি করুন",
  generate_key: "রিকভারি কোড তৈরি করুন",
  purge_desc: "স্থায়ীভাবে সব লোকাল ডাটা মুছে যাবে",
  purge_btn: "সব ডাটা মুছুন",

  // --- Identity & Profile ---
  identity_hub_title: "অ্যাকাউন্ট",
  master_profile_protocol: "প্রোফাইল তথ্য",
  google_verified: "গুগল দ্বারা যাচাইকৃত",
  identity_secured: "অ্যাকাউন্ট নিরাপদ",
  standard_identity: "ভল্ট আইডি",
  email_auth_active: "ইমেইল সুরক্ষা চালু",
  label_connection: "সংযোগ",
  label_hierarchy: "অবস্থান",
  danger_zone_title: "ঝুঁকিপূর্ণ অংশ",
  label_termination: "অ্যাকাউন্ট ডিলিট",
  desc_termination: "সব ক্লাউড ও লোকাল ডাটা মুছে যাবে",
  btn_delete_identity: "অ্যাকাউন্ট মুছুন",
  critical_auth: "নিরাপত্তা যাচাই",
  warn_ledger_loss: "সব লেজার মুছে যাবে",
  warn_backup_loss: "সব ব্যাকআপ নষ্ট হবে",
  warn_irreversible: "এই কাজটি আর ফেরানো যাবে না",
  label_type_email: "নিশ্চিত করতে ইমেইল লিখুন",
  security_protocol_title: "নিরাপত্তা সেটিংস",
  identity_name_label: "নাম",
  current_key_label: "বর্তমান পাসওয়ার্ড",
  new_key_label: "নতুন পাসওয়ার্ড",
  action_save_security: "সেভ করুন",

  // --- Analytics & Reports ---
  analytics_intelligence: "হিসাবের রিপোর্ট",
  flow_velocity: "আয়–ব্যয়ের ট্রেন্ড",
  capital_split: "টাকার ভাগ",
  liquidity_protocol: "নগদ প্রবাহ",
  total_expense: "মোট খরচ",
  awaiting_intel: "ডাটা পাওয়া যায়নি",
  cash_archive: "নগদ",
  bank_archive: "ব্যাংক",
  export_title: "ডাটা ডাউনলোড",
  btn_extract: "ডাউনলোড করুন",

  // --- Sorting ---
  sort_date: "তারিখ অনুযায়ী",
  sort_amount: "পরিমাণ অনুযায়ী",
  sort_title: "নাম অনুযায়ী",
  sort_activity: "অ্যাক্টিভিটি অনুযায়ী",
  sort_name: "নাম অনুযায়ী",
  sort_balance_high: "ব্যালেন্স: বেশি",
  sort_balance_low: "ব্যালেন্স: কম",

  // --- Tooltips (tt_) ---
  tt_add_entry: "নতুন লেনদেন যোগ করুন",
  tt_analytics: "রিপোর্ট দেখুন",
  tt_export: "ডাটা ডাউনলোড করুন",
  tt_midnight: "ডার্ক মোড চালু করুন",
  tt_shield: "সেশন সুরক্ষা চালু",
  tt_back_dashboard: "ড্যাশবোর্ডে ফিরে যান",
  tt_toggle_theme: "থিম পরিবর্তন করুন",
  tt_more_options: "আরও সেটিংস",
  tt_edit_record: "লেনদেন পরিবর্তন করুন",
  tt_delete_record: "লেনদেন মুছুন",
  tt_change_status: "স্ট্যাটাস পরিবর্তন",
  tt_purge_warning: "সতর্কতা: সব ডাটা মুছে যাবে",
  tt_restore: "ব্যাকআপ ফিরিয়ে আনুন",
  tt_backup: "ব্যাকআপ ডাউনলোড করুন",

  // --- Messages & Toast ---
  success_entry_secured: "লেনদেন সফলভাবে সংরক্ষণ হয়েছে",
  err_protocol_sync: "ইন্টারনেট নেই — লোকালে সেভ হয়েছে",
  success_entry_terminated: "লেনদেন মুছে ফেলা হয়েছে",
  err_termination_failed: "মুছতে সমস্যা হয়েছে",
  btn_undo: "আগের অবস্থায় ফিরুন",


   
  BTN_CREATE_VAULT: "নতুন ভল্ট তৈরি করুন",
  TT_ACCOUNT_SETTING: "অ্যাকাউন্ট সেটিংস",

  NET_ASSET: "মোট ব্যালেন্স",

  TT_CHANGE_SORT_ORDER: "সাজানোর ধরন পরিবর্তন করুন",
  TT_IMPORT_LEDGER: "লেজার ইম্পোর্ট করুন",

  TT_INFLOW: "আয়ের এন্ট্রি",
  TT_OUTFLOW: "ব্যয়ের এন্ট্রি",
  TT_PENDING: "অপেক্ষমান টাকা",
  TT_SURPLUS: "অবশিষ্ট ব্যালেন্স",

  TT_FILTER_VATEGORY: "ক্যাটাগরি অনুযায়ী ফিল্টার",
  TT_FILTER_BY: "ফিল্টার করুন",
  TT_FILTER_BY_FILTER_TYPE: "ফিল্টারের ধরন নির্বাচন করুন",

  LABEL_DATE: "তারিখ",
  LABEL_TIME: "সময়",
  LABEL_REF_ID: "রেফারেন্স আইডি",
  LABEL_MEMO: "নোট",
  LABEL_STATUS: "স্ট্যাটাস",
  LABEL_OPTIONS: "অপশন",

  TT_TOGGLE_STATUS: "স্ট্যাটাস পরিবর্তন করুন",

  PROTOCOL_ARCHIVE: "আর্কাইভ",
  RECORDS_ANALYZED: "রেকর্ড বিশ্লেষণ করা হয়েছে",
  RECORDS_FOUND: "রেকর্ড পাওয়া গেছে",

  DESC_INFLOW: "যে টাকা এসেছে",
  DESC_OUTFLOW: "যে টাকা গেছে",
  DESC_PENDING: "এখনও সম্পন্ন হয়নি",
  DESC_SURPLUS: "অতিরিক্ত অবশিষ্ট টাকা",

  EXECUTE_REPORT_TITLE: "রিপোর্ট তৈরি করুন",
  execute_report_desc: "নির্বাচিত ডাটা থেকে রিপোর্ট তৈরি করুন",
  BTN_EXECUTE_ARCHIVE: "এখনই আর্কাইভ করুন",

  PROTOCOL_INDEX: "লেজার সূচক",
  GOVERNANCE_ACTIVE: "নিয়ন্ত্রণ সক্রিয়",
  NODE_ONLINE: "নোড অনলাইন",

  PLACEHOLDER_NEW_TAG: "নতুন ক্যাটাগরি লিখুন",
  LABEL_MONTHLY_CAP: "মাসিক সীমা",
  TITLE_INITIALIZE_VAULT: "নতুন ভল্ট শুরু করুন",

  LABEL_VISUAL_ID: "ভিজ্যুয়াল আইডি",
  placeholder_ledger_name: "লেজারের নাম",
  placeholder_vault_memo: "ভল্ট নোট (ঐচ্ছিক)",

  type_general: "সাধারণ",
  type_customer: "কাস্টমার",
  type_supplier: "সাপ্লায়ার",

  VIA_PROTOCOL: "মাধ্যম",

  category_general: "সাধারণ",
  category_amount: "পরিমাণ",
  category_title: "শিরোনাম",
  category_all: "সব",
  category_salary: "বেতন",
  category_food: "খাবার",
  category_rent: "ভাড়া",
  category_shopping: "কেনাকাটা",
  category_date: "তারিখ",
  category_income: "আয়",
  category_expense: "ব্যয়",

  ACTION_ACCOUNT_SETTINGS: "অ্যাকাউন্ট সেটিংস",

  LABEL_INTEGRITY: "ডাটার নিরাপত্তা",
  TT_UPLOAD_PHOTO: "ছবি আপলোড করুন",
  TT_REMOVE_PHOTO: "ছবি মুছে ফেলুন",
  TT_VAULT_AUTH: "ভল্ট যাচাই",

  LABEL_STANDARD_IDENTITY: "স্ট্যান্ডার্ড পরিচয়",
  TT_NETWORK_STABLE: "নেটওয়ার্ক স্থিতিশীল",
  LABEL_RANK_MASTER: "মাস্টার",

  DATA_SOVEREIGNTY_TITLE: "ডাটা নিয়ন্ত্রণ",
  data_sovereignty_desc: "আপনার ডাটার সম্পূর্ণ নিয়ন্ত্রণ আপনার হাতেই",

  TT_ARCHIVE_STATUS: "আর্কাইভ স্ট্যাটাস",

  ACTION_BACKUP: "ব্যাকআপ",
  ACTION_RESTORE: "রিস্টোর",

  AUDIT_LOG_TITLE: "অডিট লগ",
  TT_AUDIT_LOG: "অডিট লগ দেখুন",
  TT_MONITOROING: "সিস্টেম পর্যবেক্ষণ",

  TT_EVENT_IDENTITY: "পরিচয় সংক্রান্ত ইভেন্ট",
  TT_EVENT_BACKUP: "ব্যাকআপ ইভেন্ট",
  TT_EVENT_SESSION: "সেশন ইভেন্ট",

  time_just_now: "এইমাত্র",
  time_2h_ago: "২ ঘণ্টা আগে",
  time_yesterday: "গতকাল",

  event_identity_updated: "পরিচয় আপডেট হয়েছে",
  event_backup_exported: "ব্যাকআপ ডাউনলোড হয়েছে",
  event_session_verified: "সেশন যাচাই হয়েছে",

  audit_node_info: "নোডের কার্যক্রম তথ্য",

  TT_SOVEREIGNTY_DESC: "আপনার ডাটা আপনার নিয়ন্ত্রণেই থাকে",
  TT_RESTORE_IDENTITY: "পরিচয় ফিরিয়ে আনুন",
  TT_BACKUP_IDENTITY: "পরিচয়ের ব্যাকআপ",

  TT_DENGER_NODE: "সতর্কতা: ঝুঁকিপূর্ণ কাজ",
  TT_TERMINATOR_WARNING: "এই কাজটি আর ফেরানো যাবে না",

  IDENTITY_VERIFIED: "পরিচয় যাচাই হয়েছে",

  health_score_label: "আর্থিক স্বাস্থ্য স্কোর",
    turbo_mode_on: "টার্বো মোড: সক্রিয়",
    account_suspended: "অ্যাকাউন্ট স্থগিত করা হয়েছে",

    // ওয়ার্নিং এবং অ্যালার্ট
    duplicate_warning: "সতর্কতা: সম্প্রতি একই ধরণের এন্ট্রি যোগ করা হয়েছে!",
    sync_error: "সিঙ্ক ব্যর্থ হয়েছে। ব্যাকগ্রাউন্ডে চেষ্টা করা হচ্ছে...",
    network_offline: "অফলাইন মোড: ডাটা পরে সিঙ্ক হবে",

    // অ্যাকশন
    save: "সংরক্ষণ",
    cancel: "বাতিল",
    undo: "পূর্বাবস্থায়",
    delete: "ডিলিট",
    restore: "রিস্টোর",
 
}

};