
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListOrdered, 
  Folders, 
  Settings, 
  LogOut, 
  Calculator
} from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Get initials from user's name for avatar fallback
  const getInitials = () => {
    if (!user) return "U";
    return `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase() || "U";
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const sidebarItems = [
    { 
      path: "/dashboard", 
      label: "Tableau de bord", 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      path: "/create-offer", 
      label: "Créer une offre", 
      icon: <PlusCircle className="h-5 w-5" /> 
    },
    { 
      path: "/offers", 
      label: "Mes offres", 
      icon: <ListOrdered className="h-5 w-5" /> 
    },
    { 
      path: "/catalog", 
      label: "Catalogue", 
      icon: <Folders className="h-5 w-5" /> 
    },
    {
      path: "/calculator",
      label: "Calculateur",
      icon: <Calculator className="h-5 w-5" />
    },
    { 
      path: "/settings", 
      label: "Paramètres", 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];

  // Initial entrance animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        staggerChildren: 0.1,
        when: "beforeChildren" 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      className="w-16 h-screen flex flex-col items-center py-6 bg-sidebar border-r border-sidebar-border shadow-sm z-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Avatar en haut de la sidebar */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/settings" className="mb-8">
              <Avatar>
                <AvatarImage src={user?.avatar_url || ""} alt={user?.first_name || "User"} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrateur' : 
                     user?.role === 'partner' ? 'Partenaire' : 'Client'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex flex-col items-center space-y-6 flex-1">
        {sidebarItems.map((item) => (
          <motion.div key={item.path} variants={itemVariants}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={`p-2 rounded-md transition-colors flex items-center justify-center ${
                      location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path))
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {item.icon}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        ))}
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors mt-auto"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Déconnexion</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
};

export default Sidebar;
