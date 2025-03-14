
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaser } from "@/types/equipment";

interface MarginCalculatorProps {
  targetMonthlyPayment: number;
  setTargetMonthlyPayment: (value: number) => void;
  calculatedMargin: { percentage: number; amount: number };
  applyCalculatedMargin: () => void;
  selectedLeaser: Leaser | null;
}

const MarginCalculator: React.FC<MarginCalculatorProps> = ({
  targetMonthlyPayment,
  setTargetMonthlyPayment,
  calculatedMargin,
  applyCalculatedMargin,
  selectedLeaser
}) => {
  const [inputValue, setInputValue] = useState(targetMonthlyPayment ? targetMonthlyPayment.toString() : "");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      setTargetMonthlyPayment(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const handleApplyMargin = () => {
    applyCalculatedMargin();
    // When applying the margin, also update the targetMonthlyPayment to ensure
    // the displayed monthly payment in the parent component gets updated
    if (targetMonthlyPayment > 0) {
      setTargetMonthlyPayment(targetMonthlyPayment);
    }
  };

  return (
    <Card className="shadow-sm border-gray-200 rounded-lg">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-medium">Calcul de la marge à partir de la mensualité souhaitée</CardTitle>
        {selectedLeaser && (
          <div className="text-sm text-muted-foreground">
            Prestataire: {selectedLeaser.name}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-5">
          <div>
            <Label htmlFor="target-monthly" className="font-medium text-gray-700">Mensualité souhaitée (€)</Label>
            <div className="mt-1 relative">
              <span className="absolute left-3 top-3 text-gray-500">€</span>
              <Input
                id="target-monthly"
                type="number"
                min="0"
                step="0.01"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Marge nécessaire :</span>
              <span className="font-medium">{formatPercentage(calculatedMargin.percentage)}</span>
            </div>
            <div className="flex justify-between py-1 text-blue-600">
              <span className="font-medium">Marge en euros :</span>
              <span className="font-bold">{formatCurrency(calculatedMargin.amount)}</span>
            </div>
          </div>

          <Button 
            onClick={handleApplyMargin}
            disabled={calculatedMargin.percentage <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Appliquer cette marge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarginCalculator;
