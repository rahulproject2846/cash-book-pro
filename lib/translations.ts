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

  // --- Report & Analytics ---
  awaiting_intel: string;
  total_expense: string;
  flow_velocity: string;
  capital_split: string;
  liquidity_protocol: string;
  syncing_intel: string;
  records_analyzed: string;
  execute_report_title: string;
  execute_report_desc: string;
  btn_execute_archive: string;
  range_7d: string;
  range_30d: string;
  range_90d: string;
  tt_flow_velocity: string;
  tt_analytics_node: string;
  tt_change_range: string;
  label_days_short: string;

  // --- Export Modal ---
  export_title: string;
  range_selector: string;
  filter_class: string;
  format_selection: string;
  format_pdf: string;
  format_excel: string;
  status_ready: string;
  protocols_label: string;
  extracting_status: string;
  btn_extract: string;
  err_no_archive_records: string;
  success_archive_exported: string;
  err_protocol_export: string;

  // --- Quick Actions Modal ---
  action_menu_title: string;
  create_new_book: string;
  create_book_desc: string;
  quick_entry: string;
  quick_entry_desc: string;
  config_vault: string;
  classification: string;
  sort_order: string;
  action_toggle_sort: string;
  label_export: string;
  units_secured: string;
  ledger_live_feed: string;
  ledger_untitled: string;
  empty_ledger: string;
  protocol_archive: string;

  // --- Share Modal ---
  share_vault_title: string;
  status_live: string;
  status_private: string;
  desc_public: string;
  desc_private: string;
  btn_disable: string;
  btn_enable: string;
  label_access_url: string;
  share_info_footer: string;
  link_copied: string;

  // --- Book & Entry Forms ---
  title_vault_upgrade: string;
  sync_ready: string;
  close_modal: string;
  select_image: string;
  add_image: string;
  label_visual_id: string;
  type_general: string;
  placeholder_identity_name: string;
  placeholder_vault_memo: string;
  btn_upgrade: string;
  duplicate_warning: string;
  save_entry: string;

  // --- Auth Views ---
  placeholder_name: string;
  placeholder_email: string;
  placeholder_key: string;
  placeholder_command: string;
  title_protocol_init: string;
  auth_secure_transaction: string;
  btn_request_code: string;
  tt_auth_request_code: string;
  auth_syncing_id: string;
  auth_id_verified: string;
  auth_failed: string;
  auth_net_error: string;
  auth_denied: string;
  auth_verifying: string;
  auth_establishing_link: string;
  auth_authorized: string;
  auth_generating_proto: string;
  auth_proto_sent: string;
  auth_invalid_code: string;
  auth_verifying_id: string;
  auth_init_success: string;
  auth_sys_error: string;
  title_protocol_verify: string;
  label_entry_key: string;
  tt_auth_confirm_id: string;
  btn_adjust_detail: string;
  btn_resend_protocol: string;
  auth_sending_recovery: string;
  auth_recovery_sent: string;
  auth_email_not_found: string;
  auth_conn_failed: string;
  tt_send_recovery: string;

  // --- Danger Zone & Termination ---
  term_confirm_title: string;
  term_warning: string;
  placeholder_identity_confirm: string;
  cancel: string;
  warn_ledger_loss: string;
  warn_backup_loss: string;
  warn_irreversible: string;
  critical_auth: string;
  tt_execute_purge: string;
  tt_match_identity: string;
  action_auth_termination: string;
  protocol_locked: string;

  // --- Entry Card & Actions ---
  untitled_entry: string;
  note: string;
  btn_edit: string;
  btn_delete: string;
  edit_book: string;
  delete_book: string;
  edit_entry: string;
  delete_entry: string;
  tt_quick_add: string;
  label_note: string;
  no_memo: string;

  // --- Table Headers ---
  label_date: string;
  label_time: string;
  label_ref_id: string;
  label_protocol: string;
  label_options: string;
  label_ref: string;
  ledger_end: string;

  // --- Timeline & Records ---
  no_timeline_records: string;
  records_found: string;
  protocol_index: string;
  tt_verified_node: string;
  tt_classification: string;
  tt_toggle_status: string;
  tt_edit_record: string;
  tt_delete_record: string;
  tt_close: string;
  tt_more: string;

  // --- Pagination ---
  showing: string;
  items_per_page: string;
  page: string;
  tt_prev_page: string;
  tt_next_page: string;

  // --- Settings & Registry ---
  interface_engine: string;
  registry_tags: string;
  placeholder_new_tag: string;
  expense_threshold: string;
  label_monthly_cap: string;
  tt_save_limit: string;
  tt_turbo: string;
  tt_midnight: string;
  tt_compact: string;
  tt_autolock: string;
  tt_reminders: string;
  tt_tooltips_global: string;
  governance_active: string;
  system_version: string;
  hardware_health: string;
  data_weight: string;
  local_registry: string;
  recovery_protocol: string;
  recovery_desc: string;
  tt_generate_hash: string;
  generate_key: string;
  purge_desc: string;
  tt_purge_warning: string;

  // --- Profile & Security ---
  identity_hub_title: string;
  master_profile_protocol: string;
  security_protocol_title: string;
  status_master: string;
  identity_name_label: string;
  current_key_label: string;
  new_key_label: string;
  google_locked_label: string;
  tt_google_pass_locked: string;
  tt_save_google: string;
  tt_save_security: string;
  tt_master_rank: string;
  tt_security_node: string;
  label_integrity: string;
  tt_integrity_score: string;
  tt_display_identity: string;
  tt_profile_secured: string;
  tt_google_auth: string;
  label_google_verified: string;
  tt_vault_auth: string;
  tt_network_status: string;
  tt_access_rank: string;
  tt_node_serial: string;
  label_type_email: string;

  // --- Data Sovereignty ---
  tt_sovereignty_node: string;
  tt_archive_status: string;
  tt_sovereignty_desc: string;
  tt_restore_identity: string;
  tt_backup_identity: string;

  // --- Modals & Shortcuts ---
  modal_analytics_title: string;
  modal_shortcut_title: string;
  tt_shortcut_initialize: string;
  shortcut_desc: string;

  // --- Stats Grid ---
  desc_inflow: string;
  desc_outflow: string;
  desc_pending: string;
  desc_surplus: string;
  status_secured: string;

  // --- Dashboard & Header ---
  financial_dashboard: string;
  tt_back_dashboard: string;
  tt_toggle_theme: string;
  tt_add_entry: string;
  tt_initialize_ledger: string;
  action_share_access: string;
  action_export_report: string;
  action_terminate_vault: string;
  action_account_settings: string;
  action_manage_profile: string;
  tt_import_ledger: string;
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
  last_sync_time: "Last synced: Just Now",

  // --- Report & Analytics ---
  awaiting_intel: "No Analytics Data",
  total_expense: "TOTAL",
  flow_velocity: "Flow Velocity Trend",
  capital_split: "Capital Split",
  liquidity_protocol: "Liquidity Analysis",
  syncing_intel: "Syncing Reports...",
  records_analyzed: "Records Analyzed",
  execute_report_title: "Generate Report",
  execute_report_desc: "Create a detailed report of all your financial data.",
  btn_execute_archive: "Generate Archive",
  range_7d: "7 Days Protocol",
  range_30d: "30 Days Cycle",
  range_90d: "90 Days Archive",
  tt_flow_velocity: "Monitors transaction speed",
  tt_analytics_node: "Analytics Engine Active",
  tt_change_range: "Change Time Cycle",
  label_days_short: "D",

  // --- Export Modal ---
  export_title: "Export Data",
  range_selector: "Date Range",
  filter_class: "Category Filter",
  format_selection: "Format Selection",
  format_pdf: "PDF",
  format_excel: "Excel",
  status_ready: "Ready",
  protocols_label: "Records",
  extracting_status: "Extracting Data...",
  btn_extract: "Extract Data",
  err_no_archive_records: "No records to export",
  success_archive_exported: "Data exported successfully!",
  err_protocol_export: "Export failed. Please try again.",

  // --- Quick Actions Modal ---
  action_menu_title: "Quick Actions",
  create_new_book: "Create New Book",
  create_book_desc: "Start a new ledger",
  quick_entry: "Quick Entry",
  quick_entry_desc: "Fast transaction entry",
  config_vault: "Protocol Config",
  classification: "Category",
  sort_order: "Sorting",
  action_toggle_sort: "Toggle Sort",
  label_export: "Export",
  units_secured: "Records",
  ledger_live_feed: "Live Feed",
  ledger_untitled: "Untitled Book",
  empty_ledger: "No entries yet",
  protocol_archive: "Transaction Archive",

  // --- Share Modal ---
  share_vault_title: "Access Protocol",
  status_live: "Public",
  status_private: "Private",
  desc_public: "Anyone with the link can view",
  desc_private: "Only you can access",
  btn_disable: "Make Private",
  btn_enable: "Make Public",
  label_access_url: "Public URL",
  share_info_footer: "Share this link to give others access to your ledger.",
  link_copied: "Link Copied!",

  // --- Book & Entry Forms ---
  title_vault_upgrade: "Edit Book",
  sync_ready: "Sync Ready",
  close_modal: "Close",
  select_image: "Select Image",
  add_image: "Add Image",
  label_visual_id: "Book Cover",
  type_general: "General",
  placeholder_identity_name: "Enter book name",
  placeholder_vault_memo: "Add a note (optional)",
  btn_upgrade: "Update Book",
  duplicate_warning: "Similar entry exists",
  save_entry: "Save Entry",

  // --- Auth Views ---
  placeholder_name: "Your Name",
  placeholder_email: "Email Address",
  placeholder_key: "Password",
  placeholder_command: "Search protocols...",
  title_protocol_init: "Initial Setup",
  auth_secure_transaction: "Secure Transaction",
  btn_request_code: "Send Code",
  tt_auth_request_code: "Request verification code",
  auth_syncing_id: "Syncing Identity...",
  auth_id_verified: "Identity Verified",
  auth_failed: "Authentication Failed",
  auth_net_error: "Network Error",
  auth_denied: "Access Denied",
  auth_verifying: "Verifying...",
  auth_establishing_link: "Establishing Connection...",
  auth_authorized: "Authorized Successfully",
  auth_generating_proto: "Generating Protocol...",
  auth_proto_sent: "Code Sent Successfully",
  auth_invalid_code: "Enter 6-digit code",
  auth_verifying_id: "Verifying Identity...",
  auth_init_success: "Identity Authorized",
  auth_sys_error: "System Error",
  title_protocol_verify: "Verification",
  label_entry_key: "Verification Code",
  tt_auth_confirm_id: "Confirm your identity",
  btn_adjust_detail: "Change Details",
  btn_resend_protocol: "Resend Code",
  auth_sending_recovery: "Sending Recovery Link...",
  auth_recovery_sent: "Recovery Link Sent",
  auth_email_not_found: "Email not found",
  auth_conn_failed: "Connection Failed",
  tt_send_recovery: "Request recovery link",

  // --- Danger Zone & Termination ---
  term_confirm_title: "Termination Protocol",
  term_warning: "This will permanently delete",
  placeholder_identity_confirm: "Type account name to confirm",
  cancel: "Cancel",
  warn_ledger_loss: "All ledger data will be lost",
  warn_backup_loss: "Cloud backups will be deleted",
  warn_irreversible: "This action cannot be undone",
  critical_auth: "Security Authentication",
  tt_execute_purge: "Execute system purge",
  tt_match_identity: "Type name to confirm",
  action_auth_termination: "Execute System Purge",
  protocol_locked: "Session Locked",

  // --- Entry Card & Actions ---
  untitled_entry: "Untitled Entry",
  note: "Note",
  btn_edit: "Edit",
  btn_delete: "Delete",
  edit_book: "Edit Book",
  delete_book: "Delete Book",
  edit_entry: "Edit Entry",
  delete_entry: "Delete Entry",
  tt_quick_add: "Quick Add",
  label_note: "Note",
  no_memo: "No Note",

  // --- Table Headers ---
  label_date: "Date",
  label_time: "Time",
  label_ref_id: "Ref ID",
  label_protocol: "Type",
  label_options: "Options",
  label_ref: "Ref",
  ledger_end: "Ledger End",

  // --- Timeline & Records ---
  no_timeline_records: "No Records Found",
  records_found: "Records Found",
  protocol_index: "Index",
  tt_verified_node: "Registry Verified",
  tt_classification: "Category",
  tt_toggle_status: "Toggle Status",
  tt_edit_record: "Edit Record",
  tt_delete_record: "Delete Record",
  tt_close: "Close",
  tt_more: "More Options",

  // --- Pagination ---
  showing: "Showing",
  items_per_page: "per page",
  page: "Page",
  tt_prev_page: "Previous Page",
  tt_next_page: "Next Page",

  // --- Settings & Registry ---
  interface_engine: "Interface Engine",
  registry_tags: "Registry Tags",
  placeholder_new_tag: "New category name",
  expense_threshold: "Expense Threshold",
  label_monthly_cap: "Monthly Limit",
  tt_save_limit: "Save Changes",
  tt_turbo: "Enable turbo mode for faster sync",
  tt_midnight: "Use dark AMOLED theme",
  tt_compact: "Show more content on screen",
  tt_autolock: "Auto-lock after inactivity",
  tt_reminders: "Show system reminders",
  tt_tooltips_global: "Show helpful tooltips",
  governance_active: "System Registry Secured",
  system_version: "Build V18.0 Stable",
  hardware_health: "Hardware Health",
  data_weight: "Data Weight",
  local_registry: "Local Registry",
  recovery_protocol: "Recovery Protocol",
  recovery_desc: "Generate a secure hash key to restore your vault across devices.",
  tt_generate_hash: "Create secure migration key",
  generate_key: "Generate Hash Key",
  purge_desc: "Permanently wipe all local data. This cannot be undone.",
  tt_purge_warning: "Wipe all local data immediately",

  // --- Profile & Security ---
  identity_hub_title: "Identity Hub",
  master_profile_protocol: "Encryption Active",
  security_protocol_title: "Security Protocol",
  status_master: "Master Level",
  identity_name_label: "Display Name",
  current_key_label: "Current Password",
  new_key_label: "New Password",
  google_locked_label: "Managed by Google",
  tt_google_pass_locked: "Password managed by Google",
  tt_save_google: "Save via Google",
  tt_save_security: "Save security settings",
  tt_master_rank: "Highest privilege access",
  tt_security_node: "Security protocol active",
  label_integrity: "Integrity",
  tt_integrity_score: "System integrity measurement",
  tt_display_identity: "Display name",
  tt_profile_secured: "Profile secured",
  tt_google_auth: "Authenticated via Google",
  label_google_verified: "Google Verified",
  tt_vault_auth: "Standard vault identity",
  tt_network_status: "Live connection monitor",
  tt_access_rank: "Permission tier level",
  tt_node_serial: "Unique node identity",
  label_type_email: "Type your email to confirm",

  // --- Data Sovereignty ---
  tt_sovereignty_node: "Data ownership protocol active",
  tt_archive_status: "Verified JSON architecture",
  tt_sovereignty_desc: "Your data, your control",
  tt_restore_identity: "Import external protocol",
  tt_backup_identity: "Secure local snapshot",

  // --- Modals & Shortcuts ---
  modal_analytics_title: "Analytics Intelligence",
  modal_shortcut_title: "System Shortcuts",
  tt_shortcut_initialize: "Initialize new ledger",
  shortcut_desc: "Quick access commands",

  // --- Stats Grid ---
  desc_inflow: "Total income this period",
  desc_outflow: "Total expenses this period",
  desc_pending: "Pending amounts due",
  desc_surplus: "Remaining balance",
  status_secured: "Protocol Secured",

  // --- Dashboard & Header ---
  financial_dashboard: "Financial Dashboard",
  tt_back_dashboard: "Back to Dashboard",
  tt_toggle_theme: "Toggle Theme",
  tt_add_entry: "Add Entry",
  tt_initialize_ledger: "Initialize Ledger",
  action_share_access: "Share Access",
  action_export_report: "Export Report",
  action_terminate_vault: "Terminate Vault",
  action_account_settings: "Account Settings",
  action_manage_profile: "Manage Profile",
  tt_import_ledger: "Import Ledger",
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
  last_sync_time: "সর্বশেষ সিংক: এইমাত্র",

  // --- Report & Analytics ---
  awaiting_intel: "কোনো ডেটা নেই",
  total_expense: "মোট",
  flow_velocity: "লেনদেন গতি",
  capital_split: "মূলধন বিভাজন",
  liquidity_protocol: "লিকুইডিটি বিশ্লেষণ",
  syncing_intel: "রিপোর্ট সিংক হচ্ছে...",
  records_analyzed: "রেকর্ড বিশ্লেষিত",
  execute_report_title: "রিপোর্ট তৈরি",
  execute_report_desc: "আপনার সব আর্থিক ডেটার বিস্তারিত রিপোর্ট তৈরি করুন।",
  btn_execute_archive: "আর্কাইভ তৈরি",
  range_7d: "৭ দিন প্রোটোকল",
  range_30d: "৩০ দিন চক্র",
  range_90d: "৯০ দিন আর্কাইভ",
  tt_flow_velocity: "লেনদেনের গতি পর্যবেক্ষণ",
  tt_analytics_node: "অ্যানালিটিক্স চালু",
  tt_change_range: "সময় পরিবর্তন",
  label_days_short: "দিন",

  // --- Export Modal ---
  export_title: "ডেটা এক্সপোর্ট",
  range_selector: "তারিখ পরিসর",
  filter_class: "বিভাগ ফিল্টার",
  format_selection: "ফরম্যাট নির্বাচন",
  format_pdf: "পিডিএফ",
  format_excel: "এক্সেল",
  status_ready: "প্রস্তুত",
  protocols_label: "রেকর্ড",
  extracting_status: "ডেটা বের করা হচ্ছে...",
  btn_extract: "ডেটা বের করুন",
  err_no_archive_records: "এক্সপোর্ট করার মতো রেকর্ড নেই",
  success_archive_exported: "ডেটা সফলভাবে এক্সপোর্ট হয়েছে!",
  err_protocol_export: "এক্সপোর্ট ব্যর্থ। আবার চেষ্টা করুন।",

  // --- Quick Actions Modal ---
  action_menu_title: "দ্রুত অ্যাকশন",
  create_new_book: "নতুন খাতা তৈরি",
  create_book_desc: "নতুন লেজার শুরু করুন",
  quick_entry: "দ্রুত এন্ট্রি",
  quick_entry_desc: "দ্রুত লেনদেন এন্ট্রি",
  config_vault: "প্রোটোকল সেটিংস",
  classification: "বিভাগ",
  sort_order: "সাজানোর নিয়ম",
  action_toggle_sort: "সাজানো টগল",
  label_export: "এক্সপোর্ট",
  units_secured: "রেকর্ড",
  ledger_live_feed: "লাইভ ফিড",
  ledger_untitled: "শিরোনামহীন খাতা",
  empty_ledger: "কোনো এন্ট্রি নেই",
  protocol_archive: "লেনদেন আর্কাইভ",

  // --- Share Modal ---
  share_vault_title: "অ্যাক্সেস প্রোটোকল",
  status_live: "সার্বজনীন",
  status_private: "ব্যক্তিগত",
  desc_public: "লিংক যেকেউ দেখতে পারবে",
  desc_private: "শুধু আপনি দেখতে পারবেন",
  btn_disable: "ব্যক্তিগত করুন",
  btn_enable: "সার্বজনীন করুন",
  label_access_url: "পাবলিক লিংক",
  share_info_footer: "এই লিংক শেয়ার করে অন্যদের আপনার খাতা দেখার অনুমতি দিন।",
  link_copied: "লিংক কপি হয়েছে!",

  // --- Book & Entry Forms ---
  title_vault_upgrade: "খাতা সম্পাদনা",
  sync_ready: "সিংক প্রস্তুত",
  close_modal: "বন্ধ করুন",
  select_image: "ছবি নির্বাচন",
  add_image: "ছবি যোগ",
  label_visual_id: "খাতা কভার",
  type_general: "সাধারণ",
  placeholder_identity_name: "খাতার নাম লিখুন",
  placeholder_vault_memo: "নোট যোগ করুন (ঐচ্ছিক)",
  btn_upgrade: "আপডেট খাতা",
  duplicate_warning: "অনুরূপ এন্ট্রি আছে",
  save_entry: "এন্ট্রি সংরক্ষণ",

  // --- Auth Views ---
  placeholder_name: "আপনার নাম",
  placeholder_email: "ইমেইল অ্যাড্রেস",
  placeholder_key: "পাসওয়ার্ড",
  placeholder_command: "প্রোটোকল খুঁজুন...",
  title_protocol_init: "প্রাথমিক সেটআপ",
  auth_secure_transaction: "নিরাপদ লেনদেন",
  btn_request_code: "কোড পাঠান",
  tt_auth_request_code: "ভেরিফিকেশন কোড চান",
  auth_syncing_id: "আইডেন্টিটি সিংক হচ্ছে...",
  auth_id_verified: "আইডেন্টিটি যাচাই হয়েছে",
  auth_failed: "অথেনটিকেশন ব্যর্থ",
  auth_net_error: "নেটওয়ার্ক ত্রুটি",
  auth_denied: "অ্যাক্সেস প্রত্যাখ্যান",
  auth_verifying: "যাচাই হচ্ছে...",
  auth_establishing_link: "সংযোগ স্থাপন...",
  auth_authorized: "অনুমোদিত",
  auth_generating_proto: "প্রোটোকল তৈরি...",
  auth_proto_sent: "কোড পাঠানো হয়েছে",
  auth_invalid_code: "৬ সংখ্যার কোড লিখুন",
  auth_verifying_id: "আইডেন্টিটি যাচাই...",
  auth_init_success: "আইডেন্টিটি অনুমোদিত",
  auth_sys_error: "সিস্টেম ত্রুটি",
  title_protocol_verify: "ভেরিফিকেশন",
  label_entry_key: "ভেরিফিকেশন কোড",
  tt_auth_confirm_id: "আইডেন্টিটি নিশ্চিত করুন",
  btn_adjust_detail: "বিবরণ পরিবর্তন",
  btn_resend_protocol: "কোড আবার পাঠান",
  auth_sending_recovery: "রিকভারি লিংক পাঠানো হচ্ছে...",
  auth_recovery_sent: "রিকভারি লিংক পাঠানো হয়েছে",
  auth_email_not_found: "ইমেইল পাওয়া যায়নি",
  auth_conn_failed: "সংযোগ ব্যর্থ",
  tt_send_recovery: "রিকভারি লিংক চান",

  // --- Danger Zone & Termination ---
  term_confirm_title: "সমাপ্তি প্রোটোকল",
  term_warning: "এটি স্থায়ীভাবে মুছে দেবে",
  placeholder_identity_confirm: "নিশ্চিত করতে অ্যাকাউন্ট নাম লিখুন",
  cancel: "বাতিল",
  warn_ledger_loss: "সব লেজার ডেটা হারাবেন",
  warn_backup_loss: "ক্লাউড ব্যাকআপ মুছে যাবে",
  warn_irreversible: "এই কাজ ফিরিয়ে আনা যাবে না",
  critical_auth: "নিরাপত্তা অথেনটিকেশন",
  tt_execute_purge: "সিস্টেম পার্জ এক্সিকিউট",
  tt_match_identity: "নাম দিয়ে নিশ্চিত করুন",
  action_auth_termination: "সিস্টেম পার্জ এক্সিকিউট",
  protocol_locked: "সেশন লক",

  // --- Entry Card & Actions ---
  untitled_entry: "শিরোনামহীন এন্ট্রি",
  note: "নোট",
  btn_edit: "সম্পাদনা",
  btn_delete: "মুছুন",
  edit_book: "খাতা সম্পাদনা",
  delete_book: "খাতা মুছুন",
  edit_entry: "এন্ট্রি সম্পাদনা",
  delete_entry: "এন্ট্রি মুছুন",
  tt_quick_add: "দ্রুত যোগ",
  label_note: "নোট",
  no_memo: "কোনো নোট নেই",

  // --- Table Headers ---
  label_date: "তারিখ",
  label_time: "সময়",
  label_ref_id: "রেফ আইডি",
  label_protocol: "ধরন",
  label_options: "অপশন",
  label_ref: "রেফ",
  ledger_end: "লেজার শেষ",

  // --- Timeline & Records ---
  no_timeline_records: "কোনো রেকর্ড পাওয়া যায়নি",
  records_found: "রেকর্ড পাওয়া গেছে",
  protocol_index: "ইনডেক্স",
  tt_verified_node: "রেজিস্ট্রি যাচাই",
  tt_classification: "বিভাগ",
  tt_toggle_status: "স্ট্যাটাস পরিবর্তন",
  tt_edit_record: "রেকর্ড সম্পাদনা",
  tt_delete_record: "রেকর্ড মুছুন",
  tt_close: "বন্ধ",
  tt_more: "আরো অপশন",

  // --- Pagination ---
  showing: "দেখাচ্ছে",
  items_per_page: "প্রতি পেজ",
  page: "পেজ",
  tt_prev_page: "আগের পেজ",
  tt_next_page: "পরের পেজ",

  // --- Settings & Registry ---
  interface_engine: "ইন্টারফেস ইঞ্জিন",
  registry_tags: "রেজিস্ট্রি ট্যাগ",
  placeholder_new_tag: "নতুন বিভাগের নাম",
  expense_threshold: "খরচের সীমা",
  label_monthly_cap: "মাসিক সীমা",
  tt_save_limit: "পরিবর্তন সংরক্ষণ",
  tt_turbo: "দ্রুত সিংকের জন্য টার্বো মোড",
  tt_midnight: "ডার্ক অ্যামোলেড থিম ব্যবহার",
  tt_compact: "পর্দায় বেশি কন্টেন্ট দেখান",
  tt_autolock: "নিষ্ক্রিয়তার পর অটো-লক",
  tt_reminders: "সিস্টেম রিমাইন্ডার দেখান",
  tt_tooltips_global: "সহায়ক টুলটিপ দেখান",
  governance_active: "সিস্টেম রেজিস্ট্রি নিরাপদ",
  system_version: "বিল্ড V18.0 স্টেবল",
  hardware_health: "হার্ডওয়্যার স্বাস্থ্য",
  data_weight: "ডেটা ওজন",
  local_registry: "লোকাল রেজিস্ট্রি",
  recovery_protocol: "রিকভারি প্রোটোকল",
  recovery_desc: "জরুরি অবস্থায় আপনার ভল্ট পুনরুদ্ধারের জন্য একটি সুরক্ষিত হ্যাশ কী তৈরি করুন।",
  tt_generate_hash: "নিরাপদ মাইগ্রেশন কী তৈরি",
  generate_key: "হ্যাশ কী তৈরি",
  purge_desc: "সব স্থানীয় ডেটা স্থায়ীভাবে মুছুন। এটি ফিরিয়ে আনা যাবে না।",
  tt_purge_warning: "সব স্থানীয় ডেটা এখনই মুছুন",

  // --- Profile & Security ---
  identity_hub_title: "আইডেন্টিটি হাব",
  master_profile_protocol: "এনক্রিপশন সক্রিয়",
  security_protocol_title: "নিরাপত্তা প্রোটোকল",
  status_master: "মাস্টার লেভেল",
  identity_name_label: "ডিসপ্লে নাম",
  current_key_label: "বর্তমান পাসওয়ার্ড",
  new_key_label: "নতুন পাসওয়ার্ড",
  google_locked_label: "গুগল দ্বারা পরিচালিত",
  tt_google_pass_locked: "গুগল দ্বারা পাসওয়ার্ড পরিচালিত",
  tt_save_google: "গুগল দিয়ে সংরক্ষণ",
  tt_save_security: "নিরাপত্তা সেটিংস সংরক্ষণ",
  tt_master_rank: "সর্বোচ্চ অ্যাক্সেস",
  tt_security_node: "নিরাপত্তা প্রোটোকল সক্রিয়",
  label_integrity: "ইন্টিগ্রিটি",
  tt_integrity_score: "সিস্টেম ইন্টিগ্রিটি পরিমাপ",
  tt_display_identity: "ডিসপ্লে নাম",
  tt_profile_secured: "প্রোফাইল সুরক্ষিত",
  tt_google_auth: "গুগল দ্বারা অথেনটিকেটেড",
  label_google_verified: "গুগল যাচাইকৃত",
  tt_vault_auth: "স্ট্যান্ডার্ড ভল্ট আইডেন্টিটি",
  tt_network_status: "লাইভ সংযোগ পর্যবেক্ষণ",
  tt_access_rank: "পারমিশন টায়ার লেভেল",
  tt_node_serial: "ইউনিক নোড আইডেন্টিটি",
  label_type_email: "নিশ্চিত করতে ইমেইল লিখুন",

  // --- Data Sovereignty ---
  tt_sovereignty_node: "ডেটা মালিকানা প্রোটোকল সক্রিয়",
  tt_archive_status: "ভেরিফাইড জেসন আর্কিটেকচার",
  tt_sovereignty_desc: "আপনার ডেটা, আপনার নিয়ন্ত্রণ",
  tt_restore_identity: "বাহ্যিক প্রোটোকল ইম্পোর্ট",
  tt_backup_identity: "স্থানীয় স্ন্যাপশট সুরক্ষিত",

  // --- Modals & Shortcuts ---
  modal_analytics_title: "অ্যানালিটিক্স ইন্টেলিজেন্স",
  modal_shortcut_title: "সিস্টেম শর্টকাট",
  tt_shortcut_initialize: "নতুন লেজার শুরু",
  shortcut_desc: "দ্রুত অ্যাক্সেস কমান্ড",

  // --- Stats Grid ---
  desc_inflow: "এই সময়ে মোট আয়",
  desc_outflow: "এই সময়ে মোট খরচ",
  desc_pending: "বকেয়া পরিমাণ",
  desc_surplus: "অবশিষ্ট ব্যালেন্স",
  status_secured: "প্রোটোকল সুরক্ষিত",

  // --- Dashboard & Header ---
  financial_dashboard: "আর্থিক ড্যাশবোর্ড",
  tt_back_dashboard: "ড্যাশবোর্ডে ফিরুন",
  tt_toggle_theme: "থিম পরিবর্তন",
  tt_add_entry: "এন্ট্রি যোগ",
  tt_initialize_ledger: "লেজার শুরু করুন",
  action_share_access: "শেয়ার অ্যাক্সেস",
  action_export_report: "রিপোর্ট এক্সপোর্ট",
  action_terminate_vault: "ভল্ট মুছুন",
  action_account_settings: "অ্যাকাউন্ট সেটিংস",
  action_manage_profile: "প্রোফাইল পরিচালনা",
  tt_import_ledger: "লেজার ইম্পোর্ট",
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