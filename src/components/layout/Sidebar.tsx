import React from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Box,
  Settings,
  FileText,
  BookOpen,
  LogOut,
  Calculator,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface MenuItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const MenuItem = ({ to, icon: Icon, label, active, onClick }: MenuItemProps) => {
  const isMobile = useIsMobile();
  
  const handleClick = () => {
    if (onClick) onClick();
  };
  
  return isMobile ? (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 py-3 px-4 my-1 rounded-md transition-colors text-base",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
      )}
      onClick={handleClick}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  ) : (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={to}
            className={cn(
              "flex items-center justify-center py-4 px-3 my-5 rounded-md transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
            )}
            onClick={handleClick}
          >
            <Icon className="h-7 w-7" aria-hidden="true" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ActionItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const ActionItem = ({ icon: Icon, label, onClick }: ActionItemProps) => {
  const isMobile = useIsMobile();
  
  return isMobile ? (
    <button
      onClick={onClick}
      className="flex items-center gap-3 py-3 px-4 my-1 rounded-md transition-colors text-base text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{label}</span>
    </button>
  ) : (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="flex items-center justify-center py-4 px-3 my-5 rounded-md transition-colors text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
          >
            <Icon className="h-7 w-7" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

const Sidebar = ({ className, onLinkClick }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <div
      className={cn(
        "h-full flex flex-col border-r bg-background",
        isMobile ? "w-full" : "w-16",
        className
      )}
    >
      {isMobile && (
        <div className="p-4 border-b">
          <h2 className="font-bold text-xl">Hub iTakecare</h2>
        </div>
      )}
      
      <div className={cn(
        "flex-1 overflow-y-auto",
        isMobile ? "p-3" : "p-2 pt-8",
        "space-y-2"
      )}>
        <MenuItem
          to="/dashboard"
          icon={LayoutDashboard}
          label="Tableau de bord"
          active={isActive("/dashboard")}
          onClick={onLinkClick}
        />
        <MenuItem
          to="/clients"
          icon={Users}
          label="CRM"
          active={isActive("/clients")}
          onClick={onLinkClick}
        />
        <MenuItem
          to="/catalog"
          icon={Box}
          label="Catalogue"
          active={isActive("/catalog")}
          onClick={onLinkClick}
        />
        <MenuItem
          to="/offers"
          icon={FileText}
          label="Offres"
          active={isActive("/offers")}
          onClick={onLinkClick}
        />
        <MenuItem
          to="/contracts"
          icon={BookOpen}
          label="Contrats"
          active={isActive("/contracts")}
          onClick={onLinkClick}
        />
        <MenuItem
          to="/create-offer"
          icon={Calculator}
          label="Calculateur"
          active={isActive("/create-offer")}
          onClick={onLinkClick}
        />
        <MenuItem
          to="/itakecare"
          icon={Shield}
          label="iTakecare"
          active={isActive("/itakecare")}
          onClick={onLinkClick}
        />
        <MenuItem
          to="/settings"
          icon={Settings}
          label="Paramètres"
          active={isActive("/settings")}
          onClick={onLinkClick}
        />
      </div>

      {user && (
        <div className={cn(
          "border-t flex flex-col items-center", 
          isMobile ? "px-3 py-4" : "p-3 pt-6 pb-6"
        )}>
          <div className={cn(
            "flex items-center",
            isMobile ? "w-full mb-4 gap-3" : "flex-col"
          )}>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            {isMobile && (
              <div className="flex-1">
                <p className="font-medium">{user.email}</p>
              </div>
            )}
          </div>
          <ActionItem 
            icon={LogOut} 
            label="Déconnexion" 
            onClick={handleLogout} 
          />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
