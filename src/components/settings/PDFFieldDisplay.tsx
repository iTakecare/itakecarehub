
import React from "react";
import { formatCurrency } from "@/lib/utils";

// Type pour les propriétés du champ PDF
type PDFFieldDisplayProps = {
  field: {
    id: string;
    value: string;
    position: { x: number; y: number };
    style?: {
      fontSize: number;
      fontWeight?: string;
      fontStyle?: string;
      textDecoration?: string;
      color?: string;
    };
  };
  zoomLevel: number;
  currentPage: number;
  sampleData: any;
  isDraggable: boolean;
  onStartDrag: (fieldId: string, offsetX: number, offsetY: number) => void;
  onDrag: (clientX: number, clientY: number) => void;
  onEndDrag: () => void;
};

// Fonction pour résoudre les valeurs des champs avec les données d'exemple
const resolveFieldValue = (pattern: string, sampleData: any, currentPage: number): string => {
  if (!pattern || typeof pattern !== 'string') return '';
  
  return pattern.replace(/\{([^}]+)\}/g, (match, key) => {
    // Cas spécial pour le numéro de page
    if (key === 'page_number') {
      return String(currentPage + 1);
    }
    
    const keyParts = key.split('.');
    let value = sampleData;
    
    for (const part of keyParts) {
      if (value === undefined || value === null) {
        return '';
      }
      value = value[part];
    }
    
    // Formatage pour les dates
    if (key === 'created_at' && typeof value === 'string') {
      try {
        return new Date(value).toLocaleDateString();
      } catch (e) {
        return value ? String(value) : '';
      }
    }
    
    // Formatage pour les montants
    if ((key.includes('amount') || key.includes('payment') || key.includes('price') || 
         key.includes('commission')) && typeof value === 'number') {
      try {
        return formatCurrency(value);
      } catch (e) {
        return typeof value === 'number' ? String(value) : '';
      }
    }
    
    // Valeur par défaut
    if (value === undefined || value === null) return '';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
};

// Fonction pour analyser les données d'équipement à partir d'une chaîne JSON
const parseEquipmentData = (jsonString: string) => {
  try {
    if (!jsonString) return [];
    if (Array.isArray(jsonString)) return jsonString;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Erreur lors de l'analyse des données d'équipement:", error);
    return [];
  }
};

// Fonction pour calculer le prix total d'un équipement
const calculateItemTotal = (item: any) => {
  const price = parseFloat(item.purchasePrice || 0);
  const quantity = parseInt(item.quantity || 1);
  const margin = parseFloat(item.margin || 0) / 100;
  return price * quantity * (1 + margin);
};

// Rendu du tableau d'équipements
const renderEquipmentTable = (sampleData: any, zoomLevel: number) => {
  const equipment = parseEquipmentData(sampleData.equipment_description);
  
  if (!equipment || equipment.length === 0) {
    return <p className="text-sm italic">Aucun équipement disponible</p>;
  }
  
  return (
    <table className="w-full border-collapse" style={{ fontSize: `${9 * zoomLevel}px` }}>
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-1 py-0.5 text-left">Désignation</th>
          <th className="border px-1 py-0.5 text-right">Prix</th>
          <th className="border px-1 py-0.5 text-center">Qté</th>
          <th className="border px-1 py-0.5 text-center">Marge</th>
          <th className="border px-1 py-0.5 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {equipment.map((item: any, index: number) => {
          const totalPrice = calculateItemTotal(item);
          return (
            <tr key={index}>
              <td className="border px-1 py-0.5 text-left">{item.title}</td>
              <td className="border px-1 py-0.5 text-right">{formatCurrency(item.purchasePrice)}</td>
              <td className="border px-1 py-0.5 text-center">{item.quantity}</td>
              <td className="border px-1 py-0.5 text-center">{item.margin}%</td>
              <td className="border px-1 py-0.5 text-right">{formatCurrency(totalPrice)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const PDFFieldDisplay: React.FC<PDFFieldDisplayProps> = ({
  field,
  zoomLevel,
  currentPage,
  sampleData,
  isDraggable,
  onStartDrag,
  onDrag,
  onEndDrag
}) => {
  // Convertir mm en px avec le zoom appliqué
  const mmToPx = (mm: number) => mm * 3.7795275591 * zoomLevel;
  
  // Position et style du champ
  const xPx = mmToPx(field.position?.x || 0);
  const yPx = mmToPx(field.position?.y || 0);
  
  // Taille de police ajustée avec le zoom
  const fontSize = field.style?.fontSize 
    ? field.style.fontSize * zoomLevel
    : 9 * zoomLevel;
  
  // Style du champ
  const style = {
    position: "absolute" as "absolute", // Type assertion pour éviter l'erreur TS
    left: `${xPx}px`,
    top: `${yPx}px`,
    zIndex: 5,
    fontSize: `${fontSize}px`,
    fontWeight: field.style?.fontWeight || 'normal',
    fontStyle: field.style?.fontStyle || 'normal',
    textDecoration: field.style?.textDecoration || 'none',
    color: field.style?.color || 'black',
    whiteSpace: "pre-wrap" as "pre-wrap", // Type assertion pour éviter l'erreur TS
    maxWidth: field.id === 'equipment_table' 
      ? `${mmToPx(150)}px` 
      : `${mmToPx(80)}px`,
    cursor: isDraggable ? 'move' : 'default'
  };
  
  // Gestionnaires d'événements pour le drag and drop
  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    onStartDrag(field.id, offsetX, offsetY);
  };
  
  const handleDrag = (e: React.DragEvent) => {
    if (!isDraggable || !e.clientX) return;
    onDrag(e.clientX, e.clientY);
  };
  
  // Rendu du contenu du champ
  return (
    <div 
      style={style}
      className="pdf-field"
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={onEndDrag}
    >
      {field.id === 'equipment_table' ? (
        renderEquipmentTable(sampleData, zoomLevel)
      ) : (
        <span>{resolveFieldValue(field.value, sampleData, currentPage)}</span>
      )}
    </div>
  );
};

export default PDFFieldDisplay;
