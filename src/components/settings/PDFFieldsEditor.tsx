import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  MoveHorizontal, 
  User, 
  Calendar, 
  CreditCard, 
  Layout, 
  FileText, 
  Package, 
  Grid, 
  Grip, 
  Trash2, 
  Plus, 
  BookUser,
  Mail,
  Phone,
  Building,
  DollarSign,
  AlertCircle,
  Copy,
  Link,
  Unlink,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FIELD_CATEGORIES = [
  { id: "client", label: "Client", icon: User },
  { id: "offer", label: "Offre", icon: FileText },
  { id: "equipment", label: "Équipement", icon: Package },
  { id: "user", label: "Vendeur", icon: BookUser },
  { id: "general", label: "Général", icon: Layout },
];

const FIELD_TYPES = [
  { value: "text", label: "Texte" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "currency", label: "Montant" },
  { value: "number", label: "Nombre" },
  { value: "table", label: "Tableau" }
];

const CATEGORY_ICONS = {
  client: User,
  offer: FileText,
  equipment: Package,
  user: BookUser,
  general: Layout
};

const generateId = (prefix) => {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
};

const PDFFieldsEditor = ({ 
  fields, 
  onChange, 
  activePage = 0, 
  onPageChange, 
  template,
  onDeleteField,
  onAddField,
  onDuplicateField,
  onRemoveFieldFromPage
}) => {
  const [activeCategory, setActiveCategory] = useState("client");
  const [positionedField, setPositionedField] = useState(null);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [dragEnabled, setDragEnabled] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [gridSize, setGridSize] = useState(1);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(0.5);
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [fieldToDuplicate, setFieldToDuplicate] = useState(null);
  const [duplicateTargetPage, setDuplicateTargetPage] = useState(0);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [fieldToRemove, setFieldToRemove] = useState(null);
  const [directPositionMode, setDirectPositionMode] = useState(false);
  const [stepSize, setStepSize] = useState(0.5); // Taille des déplacements précis en mm
  const [manualPosition, setManualPosition] = useState({ x: 0, y: 0 });
  const [newField, setNewField] = useState({
    id: "",
    label: "",
    type: "text",
    category: "general",
    isVisible: true,
    value: "",
    position: { x: 20, y: 20 },
    page: 0
  });
  
  const canvasRef = useRef(null);
  const isDragging = useRef(false);
  const initialClickOffset = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    setPositionedField(null);
    setPageLoaded(false);
  }, [activePage]);
  
  useEffect(() => {
    const handleResize = () => {
      if (positionedField) {
        setPositionedField(null);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [positionedField]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && positionedField) {
        setPositionedField(null);
        isDragging.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [positionedField]);
  
  const fieldsByCategory = fields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {});
  
  const toggleFieldVisibility = (fieldId) => {
    const newFields = fields.map(field => 
      field.id === fieldId ? { ...field, isVisible: !field.isVisible } : field
    );
    onChange(newFields);
    toast.success(`Visibilité du champ modifiée`);
  };
  
  const updateFieldPosition = (fieldId, newPosition, page = activePage) => {
    // Arrondissement à 0.1mm près pour plus de précision
    const precisePosition = {
      x: parseFloat(newPosition.x.toFixed(1)),
      y: parseFloat(newPosition.y.toFixed(1))
    };
    
    const newFields = fields.map(field => 
      field.id === fieldId ? { ...field, position: precisePosition, page } : field
    );
    onChange(newFields);
  };
  
  const updateFieldPage = (fieldId, page) => {
    const newFields = fields.map(field => 
      field.id === fieldId ? { ...field, page } : field
    );
    onChange(newFields);
    toast.success(`Champ déplacé sur la page ${page + 1}`);
  };
  
  const getCurrentPageBackground = () => {
    if (template?.templateImages && template.templateImages.length > 0) {
      const pageImage = template.templateImages.find(img => img.page === activePage);
      
      if (pageImage && pageImage.url) {
        return `${pageImage.url}?t=${new Date().getTime()}`;
      } else {
        return null;
      }
    }
    return null;
  };

  const snapToGrid = (position) => {
    if (!gridEnabled) return position;
    
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  };
  
  const calculatePrecisePosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Dimensions d'une page A4 en mm
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Calculer le ratio pour convertir les pixels en mm
    const scaleRatio = {
      x: pageWidth / (rect.width * zoomLevel),
      y: pageHeight / (rect.height * zoomLevel)
    };
    
    // Position du curseur relative au canvas
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    
    // Convertir en mm et appliquer l'offset
    const mmX = cursorX * scaleRatio.x - initialClickOffset.current.x;
    const mmY = cursorY * scaleRatio.y - initialClickOffset.current.y;
    
    // Limiter aux dimensions de la page
    const x = Math.max(0, Math.min(pageWidth, mmX));
    const y = Math.max(0, Math.min(pageHeight, mmY));
    
    return { x, y };
  };
  
  const handleCanvasMouseMove = (e) => {
    if (positionedField && isDragging.current && dragEnabled) {
      const position = calculatePrecisePosition(e);
      
      // Appliquer la grille si activée
      const snappedPosition = gridEnabled 
        ? snapToGrid(position) 
        : { 
          x: parseFloat(position.x.toFixed(1)), 
          y: parseFloat(position.y.toFixed(1)) 
        };
      
      setCanvasPosition(snappedPosition);
      
      // Pour un positionnement en temps réel, mettre à jour immédiatement
      // Facultatif: Peut ajouter une latence
      // updateFieldPosition(positionedField, snappedPosition, activePage);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (positionedField && dragEnabled) {
      const field = fields.find(f => f.id === positionedField);
      if (!field) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      
      // Position du champ en pixels dans le canvas
      const fieldPositionPx = {
        x: (field.position.x * rect.width * zoomLevel) / 210,
        y: (field.position.y * rect.height * zoomLevel) / 297
      };
      
      // Position du clic par rapport au coin supérieur gauche du champ
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Calculer le décalage entre le clic et la position du champ
      initialClickOffset.current = {
        x: (clickX * 210) / (rect.width * zoomLevel) - field.position.x,
        y: (clickY * 297) / (rect.height * zoomLevel) - field.position.y
      };
      
      isDragging.current = true;
      e.preventDefault();
    }
  };
  
  const handleCanvasMouseUp = () => {
    if (positionedField && isDragging.current) {
      // Mettre à jour la position finale en arrondissant à 0.1mm près
      const precisePosition = {
        x: parseFloat(canvasPosition.x.toFixed(1)),
        y: parseFloat(canvasPosition.y.toFixed(1))
      };
      
      updateFieldPosition(positionedField, precisePosition, activePage);
      toast.success(`Position mise à jour: (${precisePosition.x.toFixed(1)}, ${precisePosition.y.toFixed(1)})`);
      
      isDragging.current = false;
    }
  };

  const handleCanvasMouseLeave = () => {
    if (isDragging.current) {
      isDragging.current = false;
    }
  };
  
  const startPositioning = (fieldId, initialPosition) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    setPositionedField(fieldId);
    setCanvasPosition(initialPosition);
    setManualPosition(initialPosition);
    
    // Réinitialiser l'offset pour un nouveau positionnement
    initialClickOffset.current = { x: 0, y: 0 };
    
    if (field.page !== activePage) {
      updateFieldPage(fieldId, activePage);
    }
  };
  
  // Fonction pour appliquer un mouvement précis avec les flèches du clavier
  const applyPreciseMovement = (direction) => {
    if (!positionedField) return;
    
    let newPosition = { ...canvasPosition };
    
    switch (direction) {
      case 'up':
        newPosition.y = Math.max(0, newPosition.y - stepSize);
        break;
      case 'down':
        newPosition.y = Math.min(297, newPosition.y + stepSize);
        break;
      case 'left':
        newPosition.x = Math.max(0, newPosition.x - stepSize);
        break;
      case 'right':
        newPosition.x = Math.min(210, newPosition.x + stepSize);
        break;
    }
    
    // Arrondir à 0.1mm près
    newPosition = {
      x: parseFloat(newPosition.x.toFixed(1)),
      y: parseFloat(newPosition.y.toFixed(1))
    };
    
    setCanvasPosition(newPosition);
    updateFieldPosition(positionedField, newPosition, activePage);
  };
  
  // Positionnement manuel direct en saisissant des coordonnées
  const handleManualPositionChange = (axis, value) => {
    const parsedValue = parseFloat(value);
    
    if (!isNaN(parsedValue)) {
      const newPosition = { ...manualPosition };
      
      if (axis === 'x') {
        newPosition.x = Math.min(210, Math.max(0, parsedValue));
      } else {
        newPosition.y = Math.min(297, Math.max(0, parsedValue));
      }
      
      setManualPosition(newPosition);
    }
  };
  
  const applyManualPosition = () => {
    if (positionedField) {
      // Arrondissement à 0.1mm près
      const precisePosition = {
        x: parseFloat(manualPosition.x.toFixed(1)),
        y: parseFloat(manualPosition.y.toFixed(1))
      };
      
      setCanvasPosition(precisePosition);
      updateFieldPosition(positionedField, precisePosition, activePage);
      toast.success(`Position définie manuellement: (${precisePosition.x.toFixed(1)}, ${precisePosition.y.toFixed(1)})`);
    }
  };
  
  const getCategoryIcon = (categoryId) => {
    const Icon = CATEGORY_ICONS[categoryId] || Layout;
    return <Icon className="h-4 w-4 mr-2" />;
  };
  
  const handleImageError = (e) => {
    console.error("Erreur de chargement de l'image:", e.target.src);
    e.target.src = "/placeholder.svg";
    
    setTimeout(() => {
      if (e.target.src === "/placeholder.svg") {
        const currentSrc = e.target.src;
        const timestamp = new Date().getTime();
        const newSrc = currentSrc.includes('?') 
          ? currentSrc.split('?')[0] + `?t=${timestamp}`
          : `${currentSrc}?t=${timestamp}`;
        
        console.log("Tentative de rechargement de l'image avec cache-busting:", newSrc);
        e.target.src = newSrc;
      }
    }, 2000);
  };
  
  const handleImageLoad = () => {
    console.log("Image chargée avec succès");
    setPageLoaded(true);
  };

  const handleOpenRemoveDialog = (field) => {
    setFieldToRemove(field);
    setShowRemoveDialog(true);
  };

  const handleRemoveFieldFromPage = () => {
    if (fieldToRemove && onRemoveFieldFromPage) {
      onRemoveFieldFromPage(fieldToRemove.id, fieldToRemove.page);
      setShowRemoveDialog(false);
      
      if (fieldToRemove.id === positionedField) {
        setPositionedField(null);
      }
    }
  };

  const handleDeleteField = (fieldId) => {
    if (fieldId === positionedField) {
      setPositionedField(null);
    }
    
    if (onDeleteField) {
      onDeleteField(fieldId);
    }
  };

  const handleOpenDuplicateDialog = (field) => {
    const existingPages = fields
      .filter(f => f.id === field.id || f.id.startsWith(`${field.id}_page`))
      .map(f => f.page);
    
    const availablePages = Array.from({ length: template?.templateImages?.length || 1 }, (_, i) => i)
      .filter(page => !existingPages.includes(page) && page !== field.page);
    
    setFieldToDuplicate(field);
    
    if (availablePages.length > 0) {
      setDuplicateTargetPage(availablePages[0]);
    } else {
      const nextPage = (field.page + 1) % (template?.templateImages?.length || 1);
      setDuplicateTargetPage(nextPage);
    }
    
    setShowDuplicateDialog(true);
  };

  const handleDuplicateField = () => {
    if (fieldToDuplicate && onDuplicateField) {
      onDuplicateField(fieldToDuplicate.id, duplicateTargetPage);
      setShowDuplicateDialog(false);
    }
  };

  const handleAddNewField = () => {
    const id = generateId(newField.category);
    
    const fieldToAdd = {
      ...newField,
      id,
      page: activePage,
      position: { x: 20, y: 20 }
    };
    
    if (onAddField) {
      onAddField(fieldToAdd);
      
      setNewField({
        id: "",
        label: "",
        type: "text",
        category: "general",
        isVisible: true,
        value: "",
        position: { x: 20, y: 20 },
        page: 0
      });
      
      setShowAddFieldDialog(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!positionedField) return;
    
    let handled = true;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        applyPreciseMovement('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        applyPreciseMovement('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        applyPreciseMovement('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        applyPreciseMovement('right');
        break;
      default:
        handled = false;
    }
    
    if (handled) {
      e.preventDefault();
    }
  };

  const handleRemoveFieldLabel = (e, field) => {
    e.stopPropagation();
    
    setFieldToRemove(field);
    setShowRemoveDialog(true);
  };

  const getCurrentPageFields = () => {
    return fields.filter(f => f.page === activePage || (activePage === 0 && f.page === undefined));
  };

  const totalPages = template?.templateImages?.length || 1;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Champs disponibles</h3>
              <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un champ
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouveau champ</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="field-label">Nom du champ</Label>
                      <Input 
                        id="field-label" 
                        value={newField.label} 
                        onChange={(e) => setNewField({...newField, label: e.target.value})}
                        placeholder="Ex: Numéro de téléphone client"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field-value">Valeur du champ</Label>
                      <Input 
                        id="field-value" 
                        value={newField.value} 
                        onChange={(e) => setNewField({...newField, value: e.target.value})}
                        placeholder="Ex: {clients.phone} ou texte statique"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="field-category">Catégorie</Label>
                        <Select 
                          value={newField.category} 
                          onValueChange={(value) => setNewField({...newField, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_CATEGORIES.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center">
                                  {React.createElement(category.icon, { className: "h-4 w-4 mr-2" })}
                                  {category.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field-type">Type</Label>
                        <Select 
                          value={newField.type} 
                          onValueChange={(value) => setNewField({...newField, type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleAddNewField} disabled={!newField.label || !newField.value}>
                      Ajouter le champ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
                {FIELD_CATEGORIES.map(category => (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center">
                    {React.createElement(category.icon, { className: "h-4 w-4 mr-2" })}
                    <span className="hidden sm:inline">{category.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {FIELD_CATEGORIES.map(category => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center">
                    {React.createElement(category.icon, { className: "h-4 w-4 mr-2" })}
                    Champs {category.label}
                  </h3>
                  
                  <div className="mb-6">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      Champs sur la page {activePage + 1}
                    </h4>
                    
                    {getCurrentPageFields().filter(field => field.category === category.id).length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center p-4 bg-gray-50 rounded-md">
                        Aucun champ {category.label} sur la page {activePage + 1}
                      </div>
                    ) : (
                      <Accordion type="multiple" className="space-y-2">
                        {getCurrentPageFields()
                          .filter(field => field.category === category.id)
                          .map((field) => (
                            <AccordionItem 
                              key={field.id} 
                              value={field.id} 
                              className={`border rounded-md ${field.id === positionedField ? 'bg-blue-50 border-blue-500' : ''}`}
                            >
                              <AccordionTrigger className="px-3 py-2 text-sm">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{field.label}</span>
                                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                        >
                                          <AlertCircle className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        
                                        <DropdownMenuItem 
                                          onClick={() => handleOpenDuplicateDialog(field)}
                                          className="cursor-pointer"
                                        >
                                          <Copy className="mr-2 h-4 w-4" />
                                          <span>Dupliquer sur une autre page</span>
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem 
                                          onClick={() => handleOpenRemoveDialog(field)}
                                          className="cursor-pointer text-red-500 hover:text-red-700"
                                        >
                                          <Unlink className="mr-2 h-4 w-4" />
                                          <span>Retirer de cette page</span>
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteField(field.id)}
                                          className="cursor-pointer text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Supprimer complètement</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    
                                    <Switch
                                      checked={field.isVisible}
                                      onCheckedChange={() => toggleFieldVisibility(field.id)}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-7 w-7 ${field.id === positionedField ? 'bg-blue-100' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        
                                        if (field.id === positionedField) {
                                          setPositionedField(null);
                                        } else {
                                          startPositioning(field.id, field.position);
                                        }
                                      }}
                                      disabled={!field.isVisible}
                                    >
                                      <Grip className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 py-2">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Type:</Label>
                                    <span className="text-xs">{field.type}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Position:</Label>
                                    <span className="text-xs">(x: {field.position.x.toFixed(1)}, y: {field.position.y.toFixed(1)})</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Page:</Label>
                                    <span className="text-xs">{field.page !== undefined ? field.page + 1 : 1}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Valeur:</Label>
                                    <span className="text-xs truncate max-w-[150px]" title={field.value}>{field.value}</span>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                      </Accordion>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      Tous les champs disponibles
                    </h4>
                    
                    {!fieldsByCategory[category.id] || fieldsByCategory[category.id].length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center p-4 bg-gray-50 rounded-md">
                        Aucun champ dans cette catégorie
                      </div>
                    ) : (
                      <Accordion type="multiple" className="space-y-2">
                        {fieldsByCategory[category.id]
                          .filter(field => field.page !== activePage && !(activePage === 0 && field.page === undefined))
                          .map((field) => (
                            <AccordionItem 
                              key={field.id} 
                              value={`all_${field.id}`} 
                              className="border rounded-md bg-gray-50"
                            >
                              <AccordionTrigger className="px-3 py-2 text-sm">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium text-muted-foreground">{field.label}</span>
                                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => handleOpenDuplicateDialog(field)}
                                    >
                                      <Copy className="h-3 w-3 mr-1" />
                                      Ajouter à cette page
                                    </Button>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 py-2">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Page:</Label>
                                    <span className="text-xs">{field.page !== undefined ? field.page + 1 : 1}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Valeur:</Label>
                                    <span className="text-xs truncate max-w-[150px]" title={field.value}>{field.value}</span>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                      </Accordion>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="md:col-span-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Positionnement des champs</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={dragEnabled}
                      onCheckedChange={setDragEnabled}
                      id="drag-mode"
                    />
                    <Label htmlFor="drag-mode" className="text-xs">
                      Glisser-déposer
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 mr-2">
                    <Switch
                      checked={gridEnabled}
                      onCheckedChange={setGridEnabled}
                      id="grid-mode"
                    />
                    <Label htmlFor="grid-mode" className="text-xs">
                      Grille
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 w-1/3">
                  <Label className="text-xs whitespace-nowrap">Taille grille:</Label>
                  <Slider
                    value={[gridSize]}
                    min={0.5}
                    max={10}
                    step={0.5}
                    onValueChange={(values) => setGridSize(values[0])}
                    disabled={!gridEnabled}
                    className="w-full"
                  />
                  <span className="text-xs whitespace-nowrap">{gridSize}mm</span>
                </div>
                
                <div className="flex items-center space-x-4 w-1/3">
                  <Label className="text-xs whitespace-nowrap">Zoom:</Label>
                  <Slider
                    value={[zoomLevel * 100]}
                    min={30}
                    max={100}
                    step={5}
                    onValueChange={(values) => setZoomLevel(values[0] / 100)}
                    className="w-full"
                  />
                  <span className
