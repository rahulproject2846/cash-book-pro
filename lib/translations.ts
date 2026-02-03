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
    }
};