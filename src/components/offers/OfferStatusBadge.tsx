
import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Check, Clock, FileText, AlertCircle, 
  Info, X, Pencil, User, Building, 
  ArrowRight, CreditCard, CheckCircle,
  Sparkle, Star, SendHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Définition plus simple des statuts
export const OFFER_STATUSES = {
  DRAFT: {
    id: 'draft',
    label: 'Brouillon',
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
    progressValue: 10,
    icon: Pencil,
  },
  SENT: {
    id: 'sent',
    label: 'Envoyée',
    color: 'bg-orange-100',
    textColor: 'text-orange-700',
    progressValue: 20,
    icon: SendHorizontal,
  },
  VALID_ITC: {
    id: 'valid_itc',
    label: 'Valid. ITC',
    color: 'bg-purple-100',
    textColor: 'text-purple-700',
    progressValue: 40,
    icon: Sparkle,
  },
  APPROVED: {
    id: 'approved',
    label: 'Approuvée',
    color: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    progressValue: 60,
    icon: Check,
  },
  LEASER_REVIEW: {
    id: 'leaser_review',
    label: 'Revue bailleur',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
    progressValue: 80,
    icon: Building,
  },
  FINANCED: {
    id: 'financed',
    label: 'Financée',
    color: 'bg-green-100',
    textColor: 'text-green-700',
    progressValue: 100,
    icon: Star,
  },
  REJECTED: {
    id: 'rejected',
    label: 'Rejetée',
    color: 'bg-red-100',
    textColor: 'text-red-700',
    progressValue: 0,
    icon: X,
  }
};

interface OfferStatusBadgeProps {
  status?: string;
  isConverted?: boolean;
  showProgress?: boolean;
}

const OfferStatusBadge: React.FC<OfferStatusBadgeProps> = ({ 
  status = 'draft', 
  isConverted = false,
  showProgress = false
}) => {
  // Si l'offre est convertie en contrat, on affiche un badge spécial
  if (isConverted) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900">
          <Check className="h-3 w-3 mr-1" />
          Contrat actif
        </Badge>
        {showProgress && <Progress value={100} className="h-2 bg-green-100" />}
      </div>
    );
  }

  // Récupérer les informations du statut
  const statusInfo = Object.values(OFFER_STATUSES).find(s => s.id === status) || OFFER_STATUSES.DRAFT;
  const Icon = statusInfo.icon;

  return (
    <div className="flex flex-col gap-1 w-full">
      <Badge className={cn(
        statusInfo.color,
        statusInfo.textColor,
        "hover:bg-opacity-80"
      )}>
        <Icon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
      {showProgress && (
        <Progress 
          value={statusInfo.progressValue} 
          className={cn("h-2", 
            statusInfo.progressValue === 100 ? "bg-green-100" : 
            statusInfo.progressValue === 0 ? "bg-red-100" : "bg-gray-100"
          )} 
        />
      )}
    </div>
  );
};

export default OfferStatusBadge;
