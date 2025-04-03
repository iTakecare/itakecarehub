
import React from "react";
import { formatCurrency, formatPercentageWithComma } from "@/utils/formatters";

interface PriceDetailsDisplayProps {
  marginAmount: number;
  priceWithMargin: number;
  coefficient: number;
  displayMonthlyPayment: number;
  hideFinancialDetails?: boolean;
  calculatedMargin?: { percentage: number; amount: number };
}

const PriceDetailsDisplay: React.FC<PriceDetailsDisplayProps> = ({
  marginAmount,
  priceWithMargin,
  coefficient,
  displayMonthlyPayment,
  hideFinancialDetails = true,
  calculatedMargin
}) => {
  // Vérification et calculs sécurisés
  const safeMarginAmount = !isNaN(marginAmount) && isFinite(marginAmount) ? marginAmount : 0;
  const safePriceWithMargin = !isNaN(priceWithMargin) && isFinite(priceWithMargin) ? priceWithMargin : 0;
  
  // Calcul sécurisé du prix sans marge
  const priceWithoutMargin = Math.max(0, safePriceWithMargin - safeMarginAmount);
  
  // Utiliser la marge calculée si disponible, sinon calculer
  const marginPercentage = calculatedMargin?.percentage || (priceWithoutMargin > 0 
    ? (safeMarginAmount / priceWithoutMargin) * 100 
    : 0);
  
  // Utiliser le montant de marge calculé si disponible
  const displayMarginAmount = calculatedMargin?.amount || safeMarginAmount;
  
  // Prix avec marge basé sur le montant calculé
  const displayPriceWithMargin = priceWithoutMargin + displayMarginAmount;

  // Formater uniquement quand nécessaire pour le rendu
  const safeMonthlyPayment = !isNaN(displayMonthlyPayment) && isFinite(displayMonthlyPayment) 
    ? displayMonthlyPayment 
    : 0;

  return (
    <div className="space-y-2 border-t pt-4 mt-4">
      {!hideFinancialDetails && (
        <>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Marge :</span>
            <span className="font-medium">
              {formatCurrency(displayMarginAmount)} ({formatPercentageWithComma(marginPercentage)})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Prix avec marge :</span>
            <span className="font-medium">{formatCurrency(displayPriceWithMargin)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Coefficient appliqué :</span>
            <span className="font-medium">{coefficient.toFixed(3)}</span>
          </div>
        </>
      )}
      <div className="flex justify-between items-center border-t pt-2 mt-2">
        <span className="text-blue-600 font-medium">Mensualité unitaire :</span>
        <span className="text-blue-600 font-medium text-lg">
          {formatCurrency(safeMonthlyPayment)}
        </span>
      </div>
    </div>
  );
};

export default PriceDetailsDisplay;
