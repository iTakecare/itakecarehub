
import React, { useState, memo, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Calendar, 
  CreditCard, 
  Settings, 
  Menu, 
  X,
  ChevronRight,
  Building2,
  UserCheck,
  ClipboardList,
  Calculator,
  Package,
  TrendingUp,
  HelpCircle,
  Mail
} from "lucide-react";
import CompanyLogo from "./CompanyLogo";
import SidebarUserSection from "./SidebarUserSection";
import SidebarMenuItem from "./SidebarMenuItem";

interface SidebarProps {
  className?: string;
}

const Sidebar = memo(({ className }: SidebarProps) => {
  const { user } = useAuth();
  const { companyId } = useMultiTenant();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Mémoriser les éléments de menu avec des couleurs améliorées
  const menuItems = useMemo(() => [
    { icon: BarChart3, label: "Dashboard", href: "/admin/dashboard", color: "blue" },
    { icon: UserCheck, label: "CRM", href: "/admin/clients", color: "orange" },
    { icon: FileText, label: "Contrats", href: "/admin/contracts", color: "red" },
    { icon: ClipboardList, label: "Devis", href: "/admin/offers", color: "indigo" },
    { icon: Calculator, label: "Factures", href: "/admin/invoicing", color: "pink" },
    { icon: Package, label: "Catalogue", href: "/admin/catalog", color: "emerald" },
    { icon: Mail, label: "Chat Admin", href: "/admin/chat", color: "violet" },
    { icon: Settings, label: "Paramètres", href: "/admin/settings", color: "gray" },
  ], []);

  // Mémoriser la fonction isActive
  const isActive = useCallback((href: string) => location.pathname === href, [location.pathname]);

  // Mémoriser les handlers
  const toggleCollapsed = useCallback(() => setIsCollapsed(prev => !prev), []);
  const toggleMobile = useCallback(() => setIsMobileOpen(prev => !prev), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  // Mémoriser le nom de l'entreprise
  const companyName = useMemo(() => settings?.company_name || "Leazr", [settings?.company_name]);

  if (!user || !companyId) return null;

  const SidebarContent = memo(() => (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-gray-200/60 shadow-xl">
      {/* Header avec logo - amélioration du contraste */}
      <div className={cn(
        "p-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/80 to-purple-50/80",
        isCollapsed ? "px-2" : "px-4"
      )}>
        <div className="flex items-center gap-3">
          <CompanyLogo 
            logoSize="sm"
            className={cn(
              "transition-all duration-300",
              isCollapsed ? "mx-auto" : ""
            )}
          />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              {!settingsLoading && (
                <>
                  <h1 className="text-lg font-bold text-gray-900 truncate">{companyName}</h1>
                  <p className="text-xs text-gray-600 truncate font-medium">Administration</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation avec espacement amélioré */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <SidebarMenuItem
              key={item.href}
              item={item}
              isActive={isActive}
              collapsed={isCollapsed}
              onLinkClick={closeMobile}
            />
          ))}
        </ul>
      </nav>

      {/* User Section avec meilleur contraste */}
      <div className="border-t border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-blue-50/80">
        <SidebarUserSection />
      </div>
    </div>
  ));

  return (
    <>
      {/* Mobile Toggle Button - amélioration visuelle */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 hover:bg-gray-50 transition-all duration-200"
      >
        {isMobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
      </button>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}>
        {/* Collapse Toggle - amélioration visuelle */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-8 z-10 p-2 bg-white border border-gray-200/60 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200"
        >
          <ChevronRight className={cn(
            "h-4 w-4 text-gray-600 transition-transform duration-200",
            isCollapsed ? "rotate-0" : "rotate-180"
          )} />
        </button>
        
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeMobile}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 transform transition-transform duration-300">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
