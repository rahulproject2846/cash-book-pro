/**
 * VAULT PRO: GLOBAL DICTIONARY
 * ----------------------------
 * এখানে সব কি (Key) ছোট হাতের (lowercase) রাখতে হবে।
 * ইউআই-তে দেখানোর সময় আমরা প্রোটোকল অনুযায়ী Uppercase করে নেব।
 */

export type Language = 'en' | 'bn';

export const translations = {
    en: {
        // Navigation
        nav_dashboard: "Dashboard",
        nav_analytics: "Analytics",
        nav_timeline: "Timeline",
        nav_system: "System",
        nav_signout: "Sign Out",
        
        // Ledger/Books
        ledger_hub: "Ledger Hub",
        active_vaults: "Active Vaults",
        initialize_ledger: "Initialize Ledger",
        search_placeholder: "Search Protocols...",
        sort_by: "Sort By",
        
        // Entry Modal
        protocol_entry: "Protocol Entry",
        given: "Given",
        received: "Received",
        identity_label: "Transaction Identity",
        memo_label: "Optional Memo",
        execute_protocol: "Execute Protocol",
        
        // Common
        synced: "Synced",
        pending: "Pending",
        completed: "Completed",
        verified: "Verified",

        // Settings Headers
        config_title: "Configuration",
        system_active: "System Engine Active",
        core_status: "Core Status",
        
        // Settings Modules
        governance: "Financial Governance",
        registry_tags: "Registry Tags",
        expense_threshold: "Expense Threshold",
        base_currency: "Base Currency",
        
        // Experience Module
        interface_engine: "Interface Engine",
        amoled_midnight: "AMOLED Midnight",
        compact_deck: "Compact Deck",
        session_shield: "Session Shield",
        system_pulse: "System Pulse",
        activity_brief: "Activity Brief",
        
        // Maintenance
        hardware_health: "Hardware Health",
        storage_weight: "Data Weight",
        local_registry: "Local Registry",
        hard_reset: "Hard Reset",
        purge_cache: "PURGE CACHE",
        
        // Tooltips (New)
        tt_add_entry: "Create New Record",
        tt_analytics: "View Insights",
        tt_export: "Download Data",
        tt_midnight: "Switch to True Black",
        tt_shield: "Auto-lock when inactive",

        // Reusable Actions
        save_changes: "Save Changes",
        cancel: "Cancel",
        delete: "Delete",
        active_label: "Active",
        
        // Settings - Regional
        regional_protocol: "Regional Protocol",
        system_language: "System Language",
        base_currency_desc: "Base Currency - Selected ledger unit",
        
        // Settings - Maintenance & Maintenance
        system_version: "Vault OS v5.0.1 Stable",
        data_weight: "Data Weight",
        recovery_protocol: "Recovery Protocol",
        recovery_desc: "Generate an offline recovery hash for your local vault.",
        generate_key: "Generate Master Key",
        purge_desc: "Purges local cache and forces a fresh cloud re-synchronization.",
        purge_btn: "Purge Protocol",
        
        // Tooltips (Unified)
        tt_add_tag: "Register New Identity Tag",
        tt_purge_warning: "Critical: This action is irreversible!",
        tt_compact: "Toggle high-density interface",
        tt_autolock: "Enable Identity Shield on blur",
        tt_reminders: "Configure daily sync pulses",
        tt_notifications: "Toggle activity brief alerts",

        vault_label: "Vault" ,
        empty_protocol: "Empty Protocol Records" ,
        protocol_archive: "Protocol Archive" ,


        sort_date: "Date",
sort_amount: "Amount",
sort_title: "Title",
label_export: "Export",
tt_filter_mobile: "Open Filters",
tt_sort_vaults: "Sort Protocols",
    sort_activity: "Activity",
    sort_name: "Name (A-Z)",
    sort_balance_high: "Balance (High)",
    sort_balance_low: "Balance (Low)",


    config_vault: "Vault Configuration",
label_filter_cat: "Filter Category",
action_toggle_sort: "Toggle Sort Order",
tt_close: "Close Menu",

label_ref: "REF",
label_note: "Note",
no_memo: "No Protocol Memo",
label_at: "At",
archive_end: "Protocol Archive End",
tt_toggle_status: "Change Transaction Status",


label_inflow: "Inflow", desc_inflow: "Assets Gained",
label_outflow: "Outflow", desc_outflow: "Capital Spent",
label_pending: "Pending", desc_pending: "Protocol Queue",
label_surplus: "Surplus", desc_surplus: "Net Position",
label_secured: "SECURED",

label_cash: "CASH" ,
ledger_end: "System Ledger End",
tt_edit_record: "Edit Record",
tt_delete_record: "Delete Record",
tt_change_status: "Change Status" ,


no_timeline_records: "No Protocol Registry Found",
syncing_page: "Syncing Page...",
protocols_label: "Protocols",
system_index: "System Index",


archive_synchronized: "Archive Synchronized",
syncing_protocol: "Syncing Protocol",
verified_os: "Verified OS",
tt_timeline_history: "Vault Timeline History",
tt_verified_os: "Identity Protocol Verified",


all: "All",
tt_search_records: "Search Protocols",
tt_filter_type: "Select Protocol Category",


data_sovereignty_title: "Data Sovereignty",
data_sovereignty_desc: "Backup your protocol archives locally.",
action_restore: "Restore",
action_backup: "Backup",
tt_restore: "Import protocol backup from JSON",
tt_backup: "Download full ledger registry",

protocol_integrity: "Protocol Integrity",
google_verified: "Google Verified",
identity_secured: "Identity Protocol Secured",
standard_identity: "Standard Identity",
email_auth_active: "Email Auth Active",
label_connection: "Connection",
label_hierarchy: "Hierarchy",
status_stable: "Stable",
rank_master: "Master Node",
tt_upload_photo: "Upload Master Identity Image",
tt_remove_photo: "Erase Current Photo",
tt_profile_secured: "Your identity is fully verified",


identity_hub_title: "Identity Hub",
master_profile_protocol: "Master Profile Protocol",
encrypted_hub: "Encrypted Hub",
termination_zone: "Identity Termination Zone",
action_delete_account: "Delete Account",
term_confirm_title: "Protocol: Termination",
term_auth_title: "Critical Authorization",
term_warning: "Warning: Account termination will permanently erase all nodes and registries.",
action_auth_termination: "Authorize Termination",
tt_delete_account_warning: "Permanent Identity Removal",

audit_log_title: "Security Audit Log",
event_identity_updated: "Identity Hash Updated",
event_backup_exported: "Master Backup Exported",
event_session_verified: "Security Session Verified",
time_just_now: "Just Now",
time_2h_ago: "2 hours ago",
time_yesterday: "Yesterday",
audit_node_info: "Only visible on this device node",
tt_event_identity: "Identity integrity verified",
tt_event_backup: "Local data backup successful",
tt_event_session: "Current session is secure",


danger_zone_title: "Danger Zone",
    danger_zone_desc: "Sensitive security protocols",
    label_termination: "Permanent Erasure",
    desc_termination: "This will delete all ledgers and account data.",
    btn_delete_identity: "Delete Account",
    critical_auth: "Verification Required",
    warn_ledger_loss: "All active ledgers will be erased.",
    warn_backup_loss: "Cloud backups will be purged.",
    warn_irreversible: "This action is irreversible.",
    label_type_email: "Type your email to confirm",
    tt_termination_warning: "Extreme Caution Advised",


security_protocol_title: "Security Protocol",
midnight_on: "Midnight ON",
midnight_off: "Midnight OFF",
identity_name_label: "Identity Name",
current_key_label: "Current Key",
new_key_label: "New Key (Optional)",
action_save_security: "Save Security Updates",
tt_midnight_toggle: "Toggle AMOLED Midnight Mode",
tt_save_security: "Authorize Identity Changes",

google_auth_active: "Google Identity Active", 
google_no_pass_desc: "No key rotation required for third-party protocols.",


google_locked_label: "Google Identity Locked",
tt_google_pass_locked: "Managed by Google. No manual password rotation." ,
tt_save_google: "Update profile via Google Authorization",

performance_title: "Performance",
analytics_intelligence: "Analytics Intelligence",
range_7d: "7 Days Protocol" ,
range_30d: "30 Days Cycle",
range_90d: "90 Days Archive",
label_days_short: "Days",
tt_range_selector: "Select analytics time range",


tt_inflow_desc: "Total assets successfully received",
tt_outflow_desc: "Total capital spent in this period",
tt_pending_desc: "Transactions awaiting finalization",
tt_surplus_desc: "Calculated net financial position",


    flow_velocity: "Flow Velocity Trend",
    capital_split: "Capital Split",
    liquidity_protocol: "Liquidity Protocol",
    total_expense: "Total Expense",
    awaiting_intel: "Awaiting Intel",
    cash_archive: "Cash Archive",
    bank_archive: "Bank Archive",
    tt_cash_intel: "Total liquidity in physical cash",
    tt_bank_intel: "Digital assets in banking nodes",

syncing_intel: "Syncing Intel",
execute_report_title: "Execute Report",
execute_report_desc: "Prepare and download consolidated financial protocol archive",
btn_execute_archive: "Execute Archive",
intel_env_version: "Intelligence Environment v4.8",
tt_execute_report: "Generate PDF/Excel Registry",



category_general: "General",



modal_analytics_title: "Vault Intelligence",
modal_shortcut_title: "Protocol Shortcut",
shortcut_desc: "Go to Dashboard and create vault",
tt_shortcut_initialize: "Launch Vault Creation Protocol",



title_vault_upgrade: "Protocol: Vault Upgrade",
title_initialize_vault: "Protocol: Initialize Vault",
label_visual_id: "Vault Visual ID",
type_general: "General",
 type_customer: "Customer",
 type_supplier: "Supplier",
label_ledger_name: "Ledger Name",
label_identity_name: "Identity Name",
placeholder_ledger_name: "E.G. OFFICE RENT",
placeholder_identity_name: "E.G. ABDUR RAHMAN",
label_phone_registry: "Phone Registry" ,
label_vault_memo: "Vault Memo",
placeholder_vault_memo: "ADDITIONAL PROTOCOL DETAILS...",
btn_fetch_identity: "FETCH IDENTITY",
btn_upgrade: "INITIALIZE UPGRADE" ,
btn_execute: "EXECUTE INITIALIZATION" ,
tt_upload_image: "Change Vault Image" ,
tt_fetch_contacts: "Sync with device contacts" ,




inflow: "Inflow",
outflow: "Outflow",
protocol_identity: "Protocol Identity",
more_options: "More Options",
hide_config: "Hide Configuration",
protocol_date: "Protocol Date",
record_time: "Record Time",
classification: "Classification",
via_protocol: "Via Protocol",
encrypted_memo: "Encrypted Memo",
placeholder_entry_title: "WHAT IS THIS FOR?",
placeholder_entry_memo: "SYSTEM NOTES OR REMARKS...",
tt_inflow_box: "Switch to income mode",
tt_outflow_box: "Switch to expense mode",
tt_execute: "Finalize entry into ledger",



placeholder_identity_confirm: "Type Identity to Confirm",


vault_pro: "Vault Pro", 
financial_dashboard: "Financial Dashboard", 
protocol_active: "Protocol Active", 
btn_new_entry: "NEW ENTRY" ,
btn_create_vault: "CREATE VAULT" ,
action_share_access: "Share Access" ,
action_export_report: "Export Report" ,
action_edit_ledger: "Edit Ledger" ,
action_manage_profile: "Manage Profile" ,
action_terminate_vault: "Terminate Vault" ,
action_account_settings: "Account Settings" ,
tt_back_dashboard: "Back to Dashboard" ,
tt_toggle_theme: "Switch Theme" ,
tt_more_options: "More Options" ,
tt_account_settings: "Profile & Settings" ,



protocol_locked: "Protocol locked for your privacy",



share_vault_title: "Vault Access Protocol",
status_live: "PROTOCOL: LIVE" ,
status_private: "PROTOCOL: PRIVATE",
desc_public: "Publicly Accessible" ,
desc_private: "Restricted Access" ,
btn_disable: "DISABLE" ,
btn_enable: "ENABLE" ,
label_access_url: "SECURE LINK",
link_active_warning: "● Live Public Node",
tt_disable_share: "Revoke public access" ,
tt_enable_share: "Generate public link",





status_new: "New Vault" ,
suffix_m_ago: "m ago" ,
suffix_h_ago: "h ago" ,
label_net_asset: "Net Asset" ,
tt_quick_entry: "Add Entry to Vault" ,
tt_current_balance: "Current Available Balance" ,























    },
    bn: {
        // Navigation
        nav_dashboard: "ড্যাশবোর্ড",
        nav_analytics: "অ্যানালিটিক্স",
        nav_timeline: "টাইমলাইন",
        nav_system: "সিস্টেম",
        nav_signout: "সাইন আউট",
        
        // Ledger/Books
        ledger_hub: "লেজার হাব",
        active_vaults: "সক্রিয় ভল্ট",
        initialize_ledger: "নতুন লেজার",
        search_placeholder: "অনুসন্ধান করুন...",
        sort_by: "সাজানো",
        
        // Entry Modal
        protocol_entry: "নতুন এন্ট্রি",
        given: "দিতে হবে",
        received: "পেয়েছি",
        identity_label: "বিবরণ",
        memo_label: "নোট (ঐচ্ছিক)",
        execute_protocol: "নিশ্চিত করুন",
        
        // Common
        synced: "সিঙ্কড",
        pending: "বাকি",
        completed: "সম্পন্ন",
        verified: "ভেরিফাইড",

        // Settings Headers
        config_title: "কনফিগারেশন",
        system_active: "সিস্টেম ইঞ্জিন চালু",
        core_status: "কোর স্ট্যাটাস",
        
        // Settings Modules
        governance: "ফিনান্সিয়াল গভর্নেন্স",
        registry_tags: "রেজিস্ট্রি ট্যাগ",
        expense_threshold: "খরচের সীমা",
        base_currency: "মূল মুদ্রা",
        
        // Experience Module
        interface_engine: "ইন্টারফেস ইঞ্জিন",
        amoled_midnight: "মিডনাইট মোড",
        compact_deck: "কমপ্যাক্ট ভিউ",
        session_shield: "সেশন শিল্ড",
        system_pulse: "সিস্টেম পালস",
        activity_brief: "অ্যাক্টিভিটি ব্রিফ",
        
        // Maintenance
        hardware_health: "হার্ডওয়্যার হেলথ",
        storage_weight: "ডেটা ওজন",
        local_registry: "লোকাল রেজিস্ট্রি",
        hard_reset: "হার্ড রিসেট",
        purge_cache: "ক্লিন ক্যাশ",
        
        // Tooltips (New)
        tt_add_entry: "নতুন রেকর্ড তৈরি করুন",
        tt_analytics: "ইনসাইট দেখুন",
        tt_export: "ডেটা ডাউনলোড",
        tt_midnight: "কালো থিমে যান",
        tt_shield: "নিষ্ক্রিয় থাকলে লক হবে",

        // Reusable Actions
        save_changes: "পরিবর্তন সংরক্ষণ করুন",
        cancel: "বাতিল",
        delete: "মুছে ফেলুন",
        active_label: "সক্রিয়",
        
        // Settings - Regional
        regional_protocol: "আঞ্চলিক প্রোটোকল",
        system_language: "সিস্টেম ভাষা",
        base_currency_desc: "বেস কারেন্সি - লেজার ইউনিট",
        
        // Settings - Maintenance
        system_version: "ভল্ট ওএস v5.0.1 স্টেবল",
        data_weight: "ডেটা ওজন",
        recovery_protocol: "রিকভারি প্রোটোকল",
        recovery_desc: "লোকাল ভল্টের জন্য একটি অফলাইন রিকভারি হ্যাশ তৈরি করুন।",
        generate_key: "মাস্টার কি তৈরি করুন",
        purge_desc: "লোকাল ক্যাশ মুছে ফেলে ক্লাউড থেকে ফ্রেশ সিঙ্ক শুরু করবে।",
        purge_btn: "পার্জ প্রোটোকল",
        
        // Tooltips (Unified)
        tt_add_tag: "নতুন আইডেন্টিটি ট্যাগ রেজিস্টার করুন",
        tt_purge_warning: "সতর্কতা: এটি আর ফিরিয়ে আনা সম্ভব নয়!",
        tt_compact: "উচ্চ-ঘনত্ব ইন্টারফেস চালু করুন",
        tt_autolock: "নিষ্ক্রিয় থাকলে আইডেন্টিটি শিল্ড চালু হবে",
        tt_reminders: "দৈনিক সিঙ্ক রিমাইন্ডার সেট করুন",
        tt_notifications: "অ্যাক্টিভিটি ব্রিফ অ্যালার্ট টগল করুন",

        vault_label: "ভল্ট",
        empty_protocol: "কোন রেকর্ড নেই",
        protocol_archive: "প্রোটোকল আর্কাইভ",


        sort_date: "তারিখ",
sort_amount:  "পরিমাণ",
sort_title:  "বিবরণ",
label_export:  "এক্সপোর্ট",
tt_filter_mobile: "ফিল্টার ওপেন করুন",

tt_sort_vaults: "প্রোটোকল সাজান",
    sort_activity: "অ্যাক্টিভিটি",
    sort_name: "নাম (A-Z)",
    sort_balance_high: "ব্যালেন্স (বেশি)",
    sort_balance_low: "ব্যালেন্স (কম)",

    
config_vault: "ভল্ট কনফিগারেশন",
label_filter_cat: "ক্যাটাগরি ফিল্টার",
action_toggle_sort:  "সর্ট অর্ডার পরিবর্তন",
tt_close:  "মেনু বন্ধ করুন",


label_ref: "রেফারেন্স",
label_note: "নোট",
no_memo:  "কোন নোট নেই",
label_at:  "সময়",
archive_end:  "প্রোটোকল আর্কাইভ শেষ",
tt_toggle_status:   "লেনদেনের অবস্থা পরিবর্তন করুন",



label_cash:  "নগদ",
ledger_end: "সিস্টেম লেজার শেষ",
tt_edit_record: "রেকর্ড এডিট করুন",
tt_delete_record: "রেকর্ড ডিলিট করুন",
tt_change_status: "অবস্থা পরিবর্তন করুন",


no_timeline_records: "টাইমলাইনে কোনো রেকর্ড পাওয়া যায়নি",
syncing_page: "পেজ সিঙ্ক হচ্ছে...",
protocols_label:  "প্রোটোকল",
system_index:  "সিস্টেম ইনডেক্স",




archive_synchronized:  "আর্কাইভ সিঙ্ক্রোনাইজড",
syncing_protocol: "প্রোটোকল সিঙ্ক হচ্ছে",
verified_os:"ভেরিফাইড ওএস",
tt_timeline_history: "ভল্ট টাইমলাইন হিস্ট্রি",
tt_verified_os:  "আইডেন্টিটি প্রোটোকল ভেরিফাইড",



all: "সবগুলো",
tt_search_records:  "প্রোটোকল অনুসন্ধান করুন",
tt_filter_type: "প্রোটোকল ধরন নির্বাচন করুন",


data_sovereignty_title: "ডেটা সার্বভৌমত্ব",
data_sovereignty_desc:"আপনার প্রোটোকল আর্কাইভ ব্যাকআপ নিন।",
action_restore: "রিস্টোর",
action_backup: "ব্যাকআপ",
tt_restore: "JSON থেকে প্রোটোকল ব্যাকআপ রিস্টোর করুন",
tt_backup: "সম্পূর্ণ লেজার রেজিস্ট্রি ডাউনলোড করুন",


protocol_integrity: "প্রোটোকল সততা",
google_verified: "গুগল ভেরিফাইড",
identity_secured: "পরিচয় প্রোটোকল সুরক্ষিত",
standard_identity: "সাধারণ পরিচয়",
email_auth_active: "ইমেইল অথেনটিকেশন সক্রিয়",
label_connection: "সংযোগ",
label_hierarchy: "স্তরক্রম",
status_stable: "স্থিতিশীল",
rank_master: "মাস্টার নোড",
tt_upload_photo: "প্রোফাইল ছবি আপলোড করুন",
tt_remove_photo: "বর্তমান ছবি মুছে ফেলুন",
tt_profile_secured: "আপনার পরিচয় সম্পূর্ণ যাচাইকৃত",


identity_hub_title: "পরিচয় হাব",
master_profile_protocol: "মাস্টার প্রোফাইল প্রোটোকল",
encrypted_hub: "এনক্রিপ্টেড হাব",
termination_zone:"পরিচয় সমাপ্তি অঞ্চল",
action_delete_account: "অ্যাকাউন্ট মুছুন",
term_confirm_title: "প্রোটোকল: সমাপ্তি",
term_auth_title: "গুরুত্বপূর্ণ অনুমোদন",
term_warning: "সতর্কতা: অ্যাকাউন্ট সমাপ্তি সমস্ত ডেটা স্থায়ীভাবে মুছে ফেলবে।",
action_auth_termination: "সমাপ্তি অনুমোদন করুন",
tt_delete_account_warning: "স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলা",


audit_log_title: "সিকিউরিটি অডিট লগ",
event_identity_updated: "আইডেন্টিটি হ্যাশ আপডেট করা হয়েছে",
event_backup_exported: "মাস্টার ব্যাকআপ এক্সপোর্ট করা হয়েছে",
event_session_verified: "সিকিউরিটি সেশন যাচাইকৃত",
time_just_now: "এইমাত্র",
time_2h_ago: "২ ঘণ্টা আগে",
time_yesterday: "গতকাল",
audit_node_info: "শুধুমাত্র এই ডিভাইসে দৃশ্যমান",
tt_event_identity: "পরিচয় সততা যাচাই করা হয়েছে",
tt_event_backup: "লোকাল ডেটা ব্যাকআপ সফল",
tt_event_session: "বর্তমান সেশন নিরাপদ",


danger_zone_title: "বিপজ্জনক অঞ্চল",
    danger_zone_desc: "সংবেদনশীল নিরাপত্তা প্রোটোকল",
    label_termination: "স্থায়ী অপসারণ",
    desc_termination: "এটি সব লেজার এবং অ্যাকাউন্ট ডেটা মুছে ফেলবে।",
    btn_delete_identity: "অ্যাকাউন্ট মুছুন",
    critical_auth: "যাচাইকরণ প্রয়োজন",
    warn_ledger_loss: "সব সক্রিয় লেজার মুছে ফেলা হবে।",
    warn_backup_loss: "ক্লাউড ব্যাকআপ মুছে ফেলা হবে।",
    warn_irreversible: "এই কাজটি আর ফিরিয়ে আনা সম্ভব নয়।",
    label_type_email: "নিশ্চিত করতে আপনার ইমেইল লিখুন",
    tt_termination_warning: "চরম সতর্কতা অবলম্বন করুন",


security_protocol_title: "নিরাপত্তা প্রোটোকল",
midnight_on: "মিডনাইট চালু",
midnight_off:"মিডনাইট বন্ধ",
identity_name_label: "পরিচয় নাম",
current_key_label: "বর্তমান কি (পাসওয়ার্ড)",
new_key_label: "নতুন কি (ঐচ্ছিক)",
action_save_security:  "নিরাপত্তা আপডেট সংরক্ষণ করুন",
tt_midnight_toggle:  "AMOLED মিডনাইট মোড টগল করুন",
tt_save_security:"পরিচয় পরিবর্তন অনুমোদন করুন",

google_auth_active:  "গুগল পরিচয় সক্রিয়",
google_no_pass_desc: "থার্ড-পার্টি প্রোটোকলের জন্য পাসওয়ার্ড পরিবর্তনের প্রয়োজন নেই।",


google_locked_label: "গুগল আইডি লক করা",
tt_google_pass_locked:  "গুগল দ্বারা পরিচালিত। পাসওয়ার্ড পরিবর্তনের প্রয়োজন নেই।",
tt_save_google:  "গুগল অথরাইজেশনের মাধ্যমে প্রোফাইল আপডেট করুন",

performance_title:  "পারফরম্যান্স",
analytics_intelligence:  "অ্যানালিটিক্স ইন্টেলিজেন্স",
range_7d:  "৭ দিনের প্রোটোকল",
range_30d:  "৩০ দিনের চক্র",
range_90d: "৯০ দিনের আর্কাইভ",
label_days_short:"দিন",
tt_range_selector:  "অ্যানালিটিক্স সময়কাল নির্বাচন করুন",



tt_inflow_desc:  "সফলভাবে প্রাপ্ত মোট সম্পদ",
tt_outflow_desc: "এই সময়ের মোট ব্যয়",
tt_pending_desc: "চূড়ান্তকরণের অপেক্ষায় থাকা লেনদেন",
tt_surplus_desc: "হিসাবকৃত মোট আর্থিক অবস্থা",



flow_velocity: "প্রবাহ গতিবিধি",
    capital_split: "মূলধন বিভাজন",
    liquidity_protocol: "লিকুইডিটি প্রোটোকল",
    total_expense: "মোট খরচ",
    awaiting_intel: "তথ্য সংগ্রহ করা হচ্ছে",
    cash_archive: "নগদ রেকর্ড",
    bank_archive: "ব্যাংক রেকর্ড",
    tt_cash_intel: "হাতে থাকা মোট নগদ টাকা",
    tt_bank_intel: "ব্যাংক একাউন্টে থাকা ডিজিটাল সম্পদ",


syncing_intel: "তথ্য সমন্বয় হচ্ছে",
execute_report_title: "রিপোর্ট এক্সিকিউট করুন",
execute_report_desc: "একত্রিত প্রোটোকল আর্কাইভ প্রস্তুত ও ডাউনলোড করুন",
btn_execute_archive: "আর্কাইভ এক্সিকিউট করুন",
intel_env_version: "ইন্টেলিজেন্স এনভায়রনমেন্ট v4.8",
tt_execute_report: "পিডিএফ অথবা এক্সেল জেনারেট করুন",



category_general: "সাধারণ",



modal_analytics_title: "ভল্ট ইন্টেলিজেন্স",
modal_shortcut_title: "প্রোটোকল শর্টকাট",
shortcut_desc:  "ড্যাশবোর্ডে গিয়ে নতুন ভল্ট তৈরি করুন",
tt_shortcut_initialize: "নতুন ভল্ট তৈরির প্রোটোকল শুরু করুন",



title_vault_upgrade:"প্রোটোকল: ভল্ট আপডেট",
title_initialize_vault: "প্রোটোকল: ভল্ট শুরু করুন",
label_visual_id: "ভল্ট ভিজ্যুয়াল আইডি",
type_general: "সাধারণ",
 type_customer: "গ্রাহক",
 type_supplier: "সরবরাহকারী",
label_ledger_name: "লেজারের নাম", 
label_identity_name: "পরিচয় নাম",
placeholder_ledger_name: "উদা: অফিস ভাড়া", 
placeholder_identity_name: "উদা: আবদুর রহমান",
label_phone_registry: "ফোন রেজিস্ট্রি", 
label_vault_memo: "ভল্ট মেমো",
placeholder_vault_memo: "অতিরিক্ত তথ্য...",
btn_fetch_identity: "পরিচয় খুঁজুন",
btn_upgrade: "আপডেট শুরু করুন", 
btn_execute: "কার্যকর করুন",
tt_upload_image: "ভল্ট ছবি পরিবর্তন করুন", 
tt_fetch_contacts: "কন্টাক্ট লিস্টের সাথে সিঙ্ক করুন",





inflow: "আয়",
outflow: "ব্যয়",
protocol_identity:  "প্রোটোকল পরিচিতি",
more_options:  "আরও অপশন",
hide_config:  "কনফিগারেশন লুকান",
protocol_date:  "তারিখ",
record_time: "সময়",
classification: "শ্রেণীবিভাগ",
via_protocol: "মাধ্যম",
encrypted_memo: "মেমো",
placeholder_entry_title: "এটি কিসের জন্য?",
placeholder_entry_memo: "নোট অথবা মন্তব্য...",
tt_inflow_box: "আয় মোডে পরিবর্তন করুন",
tt_outflow_box: "ব্যয় মোডে পরিবর্তন করুন",
tt_execute: "লেজারে এন্ট্রি সম্পন্ন করুন",



placeholder_identity_confirm: "নিশ্চিত করতে নাম টাইপ করুন",



vault_pro:  "ভল্ট প্রো",
financial_dashboard:  "ফিনান্সিয়াল ড্যাশবোর্ড",
protocol_active: "প্রোটোকল সক্রিয়",
btn_new_entry:  "নতুন এন্ট্রি",
btn_create_vault:  "ভল্ট তৈরি করুন",
action_share_access:  "শেয়ার অ্যাক্সেস",
action_export_report:  "রিপোর্ট এক্সপোর্ট",
action_edit_ledger: "লেজার এডিট",
action_manage_profile:  "প্রোফাইল ম্যানেজ",
action_terminate_vault:  "ভল্ট ডিলিট",
action_account_settings:  "একাউন্ট সেটিংস",
tt_back_dashboard: "ড্যাশবোর্ডে ফিরে যান",
tt_toggle_theme:  "থিম পরিবর্তন করুন",
tt_more_options:  "আরও অপশন",
tt_account_settings:  "প্রোফাইল ও সেটিংস",




protocol_locked:  "আপনার নিরাপত্তার জন্য প্রোটোকল লক করা হয়েছে",



share_vault_title: "ভল্ট অ্যাক্সেস প্রোটোকল",
status_live:  "প্রোটোকল: লাইভ",
status_private: "প্রোটোকল: প্রাইভেট",
desc_public:  "লিংকের মাধ্যমে দৃশ্যমান",
desc_private: "অ্যাক্সেস সংরক্ষিত",
btn_disable:"বন্ধ করুন",
btn_enable: "চালু করুন",
label_access_url: "সিকিউর লিংক",
link_active_warning: "● লাইভ পাবলিক নোড",
tt_disable_share: "পাবলিক অ্যাক্সেস বন্ধ করুন",
tt_enable_share: "পাবলিক লিংক তৈরি করুন",



status_new: "নতুন ভল্ট",
suffix_m_ago: " মিনিট আগে",
suffix_h_ago: " ঘণ্টা আগে",
label_net_asset:  "নেট সম্পদ",
tt_quick_entry: "ভল্টে এন্ট্রি যোগ করুন",
tt_current_balance: "বর্তমান স্থিতি",































    }
};