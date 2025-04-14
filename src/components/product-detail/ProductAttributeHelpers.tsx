
import React from "react";

export interface AttributeHelpers {
  getDisplayName: (key: string) => string;
  getCanonicalName: (key: string) => string;
  getConfigAttributes: () => { name: string; values: string[] }[];
  getCurrentValue: (attributeName: string) => string;
}

export const useAttributeHelpers = (
  specifications: Record<string, string | number> = {},
  variationAttributes: Record<string, string[]> = {},
  selectedOptions: Record<string, string> = {}
): AttributeHelpers => {
  const getDisplayName = (key: string): string => {
    // Add null check before calling toLowerCase
    if (!key) {
      return "Attribut";
    }
    
    const nameMap: Record<string, string> = {
      'condition': 'État',
      'etat': 'État',
      'screen_size': "Taille d'écran",
      'taille_ecran': "Taille d'écran",
      'stockage': 'Stockage',
      'storage': 'Stockage',
      'processor': 'Processeur',
      'processeur': 'Processeur',
      'memory': 'Mémoire (RAM)',
      'ram': 'Mémoire (RAM)',
      'graphics_card': 'Carte graphique',
      'carte_graphique': 'Carte graphique',
      'network': 'Réseau',
      'reseau': 'Réseau',
      'keyboard': 'Clavier',
      'clavier': 'Clavier'
    };
    
    return nameMap[key.toLowerCase()] || key;
  };
  
  const getCanonicalName = (key: string): string => {
    // Add null check before calling toLowerCase
    if (!key) {
      return "attribute";
    }
    
    const canonicalMap: Record<string, string> = {
      'condition': 'condition',
      'etat': 'condition',
      'screen_size': 'screen_size',
      'taille_ecran': 'screen_size',
      'stockage': 'stockage',
      'storage': 'stockage',
      'processor': 'processor',
      'processeur': 'processor',
      'memory': 'ram',
      'ram': 'ram',
      'graphics_card': 'graphics_card',
      'carte_graphique': 'graphics_card',
      'network': 'network',
      'reseau': 'network',
      'keyboard': 'keyboard'
    };
    
    return canonicalMap[key.toLowerCase()] || key;
  };
  
  const getConfigAttributes = () => {
    const priorityOrder = [
      "condition", "etat", 
      "screen_size", "taille_ecran", 
      "processor", "processeur", 
      "stockage", "storage", 
      "memory", "ram", 
      "graphics_card", "carte_graphique", 
      "network", "reseau", 
      "keyboard", "clavier"
    ];
    
    const allKeys = new Set([
      ...Object.keys(specifications || {}),
      ...Object.keys(variationAttributes || {})
    ]);
    
    const result: { name: string; values: string[] }[] = [];
    
    Array.from(allKeys).forEach(key => {
      const canonicalKey = getCanonicalName(key);
      
      // Get values from either specs or variation attributes
      let values: string[] = [];
      if (variationAttributes[key]) {
        values = variationAttributes[key];
      } else if (specifications[key] !== undefined) {
        values = [String(specifications[key])];
      }
      
      if (values.length > 0) {
        result.push({
          name: key,
          values: values
        });
      }
    });
    
    // Sort by priority
    result.sort((a, b) => {
      const indexA = priorityOrder.indexOf(getCanonicalName(a.name).toLowerCase());
      const indexB = priorityOrder.indexOf(getCanonicalName(b.name).toLowerCase());
      
      const valueA = indexA === -1 ? 999 : indexA;
      const valueB = indexB === -1 ? 999 : indexB;
      
      return valueA - valueB;
    });
    
    return result;
  };
  
  const getCurrentValue = (attributeName: string): string => {
    if (!attributeName) {
      return "";
    }
    
    if (selectedOptions[attributeName] !== undefined) {
      return String(selectedOptions[attributeName]);
    }
    
    const specValue = specifications[attributeName];
    if (specValue !== undefined) {
      return String(specValue);
    }
    
    const variationValues = variationAttributes[attributeName];
    if (variationValues && variationValues.length > 0) {
      return String(variationValues[0]);
    }
    
    return "";
  };
  
  return {
    getDisplayName,
    getCanonicalName,
    getConfigAttributes,
    getCurrentValue
  };
};

export default useAttributeHelpers;
