
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { calculateCommissionByLevel } from "@/utils/calculator";

interface AmbassadorCommissionPreviewProps {
  totalMonthlyPayment: number;
  ambassadorId?: string;
  commissionLevelId?: string;
  equipmentList: any[];
}

const AmbassadorCommissionPreview = ({
  totalMonthlyPayment,
  ambassadorId,
  commissionLevelId,
  equipmentList
}: AmbassadorCommissionPreviewProps) => {
  const [commission, setCommission] = useState<{ amount: number; rate: number; levelName: string }>({
    amount: 0,
    rate: 0,
    levelName: ""
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const calculationParamsRef = useRef<string>("");
  const calculationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const computeCountRef = useRef<number>(0);

  // Fonction pour calculer la commission avec contrôle des paramètres
  const calculateCommission = React.useCallback(async () => {
    // Vérifier si les informations nécessaires sont disponibles
    if (!ambassadorId || !commissionLevelId || !equipmentList.length) {
      return;
    }

    // Limiter le nombre de calculs
    if (computeCountRef.current > 10) {
      console.log("Too many commission calculations, skipping...");
      setTimeout(() => {
        computeCountRef.current = 0;
      }, 5000);
      return;
    }

    // Calculer le montant total de l'équipement
    const totalEquipmentAmount = equipmentList.reduce((sum, eq) => {
      const price = typeof eq.purchasePrice === 'number' ? eq.purchasePrice : 0;
      const quantity = typeof eq.quantity === 'number' ? eq.quantity : 0;
      return sum + (price * quantity);
    }, 0);
    
    // Pas besoin de calculer si le montant est nul ou trop petit
    if (totalEquipmentAmount <= 0 || totalEquipmentAmount < 10) {
      return;
    }
    
    // Créer une signature unique pour les paramètres actuels
    const currentParams = `${totalEquipmentAmount.toFixed(2)}-${commissionLevelId}-${ambassadorId}`;
    
    // Éviter les calculs redondants
    if (currentParams === calculationParamsRef.current) {
      return;
    }
    
    // Mettre à jour la référence des paramètres
    calculationParamsRef.current = currentParams;
    
    // Annuler tout calcul précédent en attente
    if (calculationTimerRef.current) {
      clearTimeout(calculationTimerRef.current);
      calculationTimerRef.current = null;
    }
    
    // Différer le calcul pour éviter les calculs trop fréquents
    setIsCalculating(true);
    
    calculationTimerRef.current = setTimeout(async () => {
      try {
        computeCountRef.current += 1;
        
        const commissionData = await calculateCommissionByLevel(
          totalEquipmentAmount,
          commissionLevelId,
          'ambassador',
          ambassadorId
        );
        
        setCommission({
          amount: commissionData.amount,
          rate: commissionData.rate,
          levelName: commissionData.levelName || ""
        });
      } catch (error) {
        console.error("Error calculating commission:", error);
      } finally {
        setIsCalculating(false);
        calculationTimerRef.current = null;
      }
    }, 500);
  }, [ambassadorId, commissionLevelId, equipmentList]);

  // Utiliser useEffect avec des dépendances stables pour déclencher le calcul
  useEffect(() => {
    if (equipmentList?.length > 0 && ambassadorId && commissionLevelId) {
      calculateCommission();
    }
    
    // Nettoyage pour éviter des fuites de mémoire
    return () => {
      if (calculationTimerRef.current) {
        clearTimeout(calculationTimerRef.current);
      }
    };
  }, [calculateCommission, equipmentList, ambassadorId, commissionLevelId]);

  // Ne pas rendre le composant si l'ID de l'ambassadeur ou du niveau de commission n'est pas disponible
  if (!ambassadorId || !commissionLevelId) {
    return null;
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 border-b">
        <CardTitle>Votre commission</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between py-2">
          {isCalculating ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calcul en cours...
            </div>
          ) : (
            <>
              <div className="font-medium">Montant de commission:</div>
              <div className="text-green-600 font-medium flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {commission.amount > 0 ? formatCurrency(commission.amount) : "0,00 €"}
                {commission.rate > 0 && (
                  <span className="text-sm text-muted-foreground">({commission.rate}%)</span>
                )}
              </div>
            </>
          )}
        </div>
        {commission.levelName && (
          <div className="mt-2 text-sm text-muted-foreground">
            Niveau de commission: {commission.levelName}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AmbassadorCommissionPreview;
