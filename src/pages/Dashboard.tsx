
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import {
  BarChart3,
  FileText,
  TrendingUp,
  ChevronRight,
  Package,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { user } = useAuth();

  // Mock data
  const recentOffers = [
    { id: 1, client: "Société A", amount: 12500, status: "Acceptée", date: "15/04/2023" },
    { id: 2, client: "Entreprise B", amount: 8750, status: "En attente", date: "28/04/2023" },
    { id: 3, client: "Cabinet C", amount: 5300, status: "En attente", date: "02/05/2023" },
  ];
  
  const totalCommission = 4325.75;
  const pendingOffersCount = 2;
  const acceptedOffersCount = 1;
  
  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.first_name || ''}
          </p>
        </div>
        <Button asChild>
          <Link to="/create-offer" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle offre
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Commissions totales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommission)}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Offres en attente
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOffersCount}</div>
            <p className="text-xs text-muted-foreground">
              Valeur: {formatCurrency(14050)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Offres acceptées
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedOffersCount}</div>
            <p className="text-xs text-muted-foreground">
              Valeur: {formatCurrency(12500)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Activité récente</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="h-[200px] w-full bg-muted/30 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Graphique d'activité</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Dernières offres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{offer.client}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(offer.amount)}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      offer.status === "Acceptée" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {offer.status}
                    </div>
                    <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/offers">
                  Voir toutes les offres
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
