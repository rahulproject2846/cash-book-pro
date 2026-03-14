"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LayoutGrid, BarChart2, History, Settings, LogOut } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers';

interface SidebarProps {
  active: string;
  setActive: (id: string) => void;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isCompact: boolean;
  onResetBook?: () => void;
}

const NAV_ITEMS: Array<{ id: string; name: string; icon: any }> = [
  { id: 'books', name: 'nav_dashboard', icon: LayoutGrid },
  { id: 'reports', name: 'nav_analytics', icon: BarChart2 },
  { id: 'timeline', name: 'nav_timeline', icon: History },
  { id: 'settings', name: 'nav_system', icon: Settings },
];

export const DesktopSidebar: React.FC<SidebarProps> = ({
  active,
  setActive,
  onLogout,
  collapsed,
  setCollapsed,
  isCompact,
  onResetBook,
}) => {
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={false}
      animate={{ width: collapsed ? 90 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}
      className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0", 
        "border-r border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-md",
        "z-[200] transition-all duration-300 ease-out"
      )}
    >
      <button 
        onClick={() => setCollapsed(!collapsed)} 
        className={cn(
          "absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full",
          "bg-orange-500 border-4 border-[var(--bg-app)] flex items-center justify-center",
          "text-white shadow-xl hover:scale-110 active:scale-90 transition-transform z-[600]"
        )}
      >
        {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
      </button>

      <div className={cn("h-28 flex items-center border-b border-[var(--border)]", collapsed ? "justify-center" : "pl-8")}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[18px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/30">V</div>
          {!collapsed && (
            <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }} className="text-xl font-black     text-[var(--text-main)]">
              {t('vault_pro_split_1')}<span className="text-orange-500">{t('vault_pro_split_2')}</span>
            </motion.h1>
          )}
        </div>
      </div>

      <div className="flex-1 py-10 px-4 space-y-2 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          const navBtn = (
            <button 
              key={item.id} 
              onClick={() => { setActive(item.id); if (onResetBook) onResetBook(); }} 
              className={cn(
                "w-full flex items-center h-14 transition-all duration-200 group relative",
                collapsed 
                  ? "justify-center rounded-[20px] px-0" 
                  : "px-5 rounded-[20px] gap-4 justify-start",
                isActive 
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]"
              )}
            >
              <item.icon size={isCompact ? 18 : 22} strokeWidth={isActive ? 2.5 : 2} />
              {!collapsed && <span className="text-[11px] font-black     ">{t(item.name)}</span>}
              {isActive && collapsed && <div className="absolute left-2 w-1 h-6 bg-white rounded-full opacity-50" />}
            </button>
          );
          return collapsed ? <Tooltip key={item.id} text={t(item.name)} position="right">{navBtn}</Tooltip> : navBtn;
        })}
      </div>

      <div className="p-6 border-t border-[var(--border)]">
        <button onClick={onLogout} className={cn("flex items-center h-12 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all", collapsed ? "justify-center" : "px-4 gap-4 w-full")}>
          <LogOut size={20} strokeWidth={2.5} /> 
          {!collapsed && <span className="text-[10px] font-black    ">{t('nav_signout')}</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default DesktopSidebar;
