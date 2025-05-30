
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeFilter } from '@/services/dashboardService';

interface TimeFilterSelectorProps {
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
  className?: string; // Added className as an optional prop
}

export const TimeFilterSelector = ({ value, onChange, className }: TimeFilterSelectorProps) => {
  return (
    <Select 
      value={value} 
      onValueChange={(val) => onChange(val as TimeFilter)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Filtre temporel" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="month">Ce mois</SelectItem>
        <SelectItem value="quarter">Ce trimestre</SelectItem>
        <SelectItem value="year">Cette année</SelectItem>
        <SelectItem value="all">Tout</SelectItem>
      </SelectContent>
    </Select>
  );
};
