
import { Equipment, Leaser, LeaserRange } from '@/types/equipment';
import { defaultLeasers } from '@/data/leasers';

export interface CalculationResult {
  totalPurchasePrice: number;
  normalMarginAmount: number;
  normalMarginPercentage: number;
  normalMonthlyPayment: number;
  adjustedMarginAmount: number;
  adjustedMarginPercentage: number;
  adjustedMonthlyPayment: number;
  marginDifference: number;
  globalCoefficient: number;
  totalFinancedAmount: number;
}

export const calculateFinancedAmountForEquipment = (equipment: Equipment): number => {
  return equipment.purchasePrice * equipment.quantity * (1 + equipment.margin / 100);
};

export const findCoefficientForAmount = (amount: number, leaser: Leaser | null): number => {
  const currentLeaser = leaser || defaultLeasers[0];
  
  if (!currentLeaser?.ranges || currentLeaser.ranges.length === 0) {
    return defaultLeasers[0].ranges[0].coefficient;
  }
  
  const range = currentLeaser.ranges.find((r: LeaserRange) => 
    amount >= r.min && amount <= r.max
  );
  
  return range?.coefficient || currentLeaser.ranges[0].coefficient;
};

export const calculateEquipmentResults = (
  equipmentList: Equipment[], 
  leaser: Leaser | null
): CalculationResult => {
  console.log("🔢 CALCUL - Début des calculs avec:", {
    equipmentCount: equipmentList.length,
    leaser: leaser?.name || "Default"
  });

  // 1. Calculer le prix d'achat total (avec quantités)
  const totalPurchasePrice = equipmentList.reduce((sum, equipment) => {
    return sum + (equipment.purchasePrice * equipment.quantity);
  }, 0);

  // 2. Calculer la marge normale (somme des marges individuelles avec quantités)
  const normalMarginAmount = equipmentList.reduce((sum, equipment) => {
    return sum + (equipment.purchasePrice * equipment.quantity * equipment.margin / 100);
  }, 0);

  const normalMarginPercentage = totalPurchasePrice > 0 
    ? (normalMarginAmount / totalPurchasePrice) * 100 
    : 0;

  // 3. Calculer le montant financé total avec les marges individuelles
  const totalFinancedAmountIndividual = totalPurchasePrice + normalMarginAmount;

  // 4. Calculer la mensualité normale (somme des mensualités individuelles)
  const normalMonthlyPayment = equipmentList.reduce((sum, equipment) => {
    if (equipment.monthlyPayment) {
      return sum + (equipment.monthlyPayment * equipment.quantity);
    }
    // Si pas de mensualité définie, calculer avec le coefficient individuel
    const financedAmount = calculateFinancedAmountForEquipment(equipment);
    const coeff = findCoefficientForAmount(financedAmount, leaser);
    const monthlyForOne = (financedAmount * coeff) / 100;
    return sum + monthlyForOne;
  }, 0);

  // 5. Calculer avec le coefficient global sur le montant financé total
  const globalCoefficient = findCoefficientForAmount(totalFinancedAmountIndividual, leaser);
  const adjustedMonthlyPayment = (totalFinancedAmountIndividual * globalCoefficient) / 100;

  // 6. Calculer la marge ajustée (inversée à partir de la mensualité globale)
  // Le montant financé nécessaire pour obtenir cette mensualité avec le coefficient global
  const requiredFinancedAmountForGlobalCoef = (adjustedMonthlyPayment * 100) / globalCoefficient;
  const adjustedMarginAmount = requiredFinancedAmountForGlobalCoef - totalPurchasePrice;
  const adjustedMarginPercentage = totalPurchasePrice > 0 
    ? (adjustedMarginAmount / totalPurchasePrice) * 100 
    : 0;

  // 7. Calculer la différence de marge réelle
  // Différence = Marge normale - Marge ajustée
  // Si positif : la marge normale est plus élevée (on perd de la marge en passant au global)
  // Si négatif : la marge ajustée est plus élevée (on gagne de la marge en passant au global)
  const marginDifference = normalMarginAmount - adjustedMarginAmount;

  console.log("🔢 CALCUL - Détail des calculs:", {
    totalPurchasePrice,
    normalMarginAmount,
    totalFinancedAmountIndividual,
    globalCoefficient,
    adjustedMonthlyPayment,
    requiredFinancedAmountForGlobalCoef,
    adjustedMarginAmount,
    marginDifference,
    explanation: marginDifference > 0 ? "Perte de marge avec coefficient global" : "Gain de marge avec coefficient global"
  });

  const result: CalculationResult = {
    totalPurchasePrice,
    normalMarginAmount,
    normalMarginPercentage,
    normalMonthlyPayment,
    adjustedMarginAmount,
    adjustedMarginPercentage,
    adjustedMonthlyPayment,
    marginDifference,
    globalCoefficient,
    totalFinancedAmount: totalFinancedAmountIndividual
  };

  console.log("🔢 CALCUL - Résultats finaux:", result);

  return result;
};
