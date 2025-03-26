
import React from "react";
import Container from "@/components/layout/Container";
import PageTransition from "@/components/layout/PageTransition";
import { formatCurrency } from "@/utils/formatters";
import { useContracts } from "@/hooks/useContracts";
import { FileText, Search, Filter, Grid, List, Plus, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ContractsKanban from "@/components/contracts/ContractsKanban";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContractsFilter from "@/components/contracts/ContractsFilter";
import ContractsSearch from "@/components/contracts/ContractsSearch";
import ContractsTable from "@/components/contracts/ContractsTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Contracts = () => {
  const {
    filteredContracts,
    loading,
    loadingError,
    searchTerm,
    setSearchTerm,
    activeStatusFilter,
    setActiveStatusFilter,
    isUpdatingStatus,
    isDeleting,
    deleteInProgress,
    isRefreshing,
    fetchContracts,
    handleUpdateContractStatus,
    handleAddTrackingInfo,
    handleDeleteContract,
    viewMode,
    setViewMode,
    includeCompleted,
    setIncludeCompleted
  } = useContracts();

  const scrollContainer = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  const handleRefresh = () => {
    fetchContracts();
  };

  if (loading && !isRefreshing) {
    return (
      <PageTransition>
        <Container>
          <div className="py-8 flex justify-center items-center">
            <div className="text-center">
              <div className="animate-spin mb-4 h-12 w-12 border-t-2 border-b-2 border-primary mx-auto rounded-full"></div>
              <p className="text-muted-foreground">Chargement des contrats...</p>
            </div>
          </div>
        </Container>
      </PageTransition>
    );
  }

  if (loadingError && filteredContracts.length === 0) {
    return (
      <PageTransition>
        <Container>
          <div className="py-8">
            <div className="text-center">
              <div className="mb-4 text-red-500">
                <FileText className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
              <p className="text-muted-foreground mb-4">{loadingError}</p>
              <Button onClick={fetchContracts}>Réessayer</Button>
            </div>
          </div>
        </Container>
      </PageTransition>
    );
  }

  if (filteredContracts.length === 0 && !isRefreshing && !isDeleting) {
    return (
      <PageTransition>
        <Container>
          <motion.div
            className="py-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="text-center py-16">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Aucun contrat trouvé</h2>
                <p className="text-muted-foreground mb-6">
                  Vous n'avez pas encore de contrats actifs.
                </p>
                <p className="text-sm text-muted-foreground">
                  Les contrats seront créés automatiquement lorsque vos offres seront approuvées par le bailleur.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Container>
        <motion.div
          className="py-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <FileText className="h-6 w-6 mr-2" />
                  <h1 className="text-2xl font-bold">Gestion des contrats</h1>
                </div>
                <p className="text-muted-foreground mt-1">
                  Gérez vos contrats et suivez leur progression
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing || loading || isDeleting}
                className="relative"
              >
                {isRefreshing ? (
                  <span className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Actualisation...
                  </span>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
            <ContractsFilter
              activeStatus={activeStatusFilter}
              onStatusChange={setActiveStatusFilter}
            />
            
            <div className="flex items-center gap-2">
              <ContractsSearch 
                value={searchTerm} 
                onChange={setSearchTerm} 
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-between p-2">
                    <Label htmlFor="show-completed" className="flex items-center cursor-pointer">
                      <span>Inclure les contrats terminés</span>
                    </Label>
                    <Switch 
                      id="show-completed"
                      checked={includeCompleted}
                      onCheckedChange={setIncludeCompleted}
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('list')} 
                  className="rounded-none px-3"
                >
                  <List className="h-4 w-4 mr-2" />
                  Liste
                </Button>
                <Button 
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('kanban')} 
                  className="rounded-none px-3"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Kanban
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants} 
            className={
              (isRefreshing || isDeleting) ? "opacity-50 pointer-events-none relative" : "relative"
            }
          >
            {loadingError && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p className="text-sm">{loadingError}</p>
              </div>
            )}
            
            {viewMode === 'kanban' ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={scrollLeft}
                    className="rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={scrollRight}
                    className="rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div ref={scrollContainer} className="overflow-hidden">
                  <ContractsKanban 
                    contracts={filteredContracts}
                    onStatusChange={handleUpdateContractStatus}
                    onAddTrackingInfo={handleAddTrackingInfo}
                    isUpdatingStatus={isUpdatingStatus}
                  />
                </div>
              </>
            ) : (
              <ContractsTable 
                contracts={filteredContracts}
                onStatusChange={handleUpdateContractStatus}
                onAddTrackingInfo={handleAddTrackingInfo}
                onDeleteContract={handleDeleteContract}
                isUpdatingStatus={isUpdatingStatus}
                isDeleting={isDeleting}
                deleteInProgress={deleteInProgress}
              />
            )}
            
            {(isRefreshing || isDeleting) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                  <p className="mt-4 font-medium text-sm">
                    {isDeleting ? "Suppression en cours..." : "Actualisation..."}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
          
          <motion.div variants={itemVariants} className="mt-6 text-sm text-muted-foreground">
            <p>
              Valeur mensuelle totale:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(
                  filteredContracts.reduce(
                    (total, contract) => total + contract.monthly_payment,
                    0
                  )
                )}
              </span>
            </p>
          </motion.div>
        </motion.div>
      </Container>
    </PageTransition>
  );
};

export default Contracts;
