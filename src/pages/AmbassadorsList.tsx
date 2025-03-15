
import React, { useState } from 'react';
import AmbassadorsList from "@/components/crm/AmbassadorsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, HeartHandshake, BadgePercent } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import PartnersList from "@/components/crm/PartnersList";
import Container from "@/components/layout/Container";
import PageTransition from "@/components/layout/PageTransition";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AmbassadorsListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("ambassadors");
  
  // Animation variants
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
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Handle navigation based on tab selection
    if (value === "clients") {
      navigate("/clients");
    } else if (value === "partners") {
      navigate("/partners");
    } else if (value === "ambassadors") {
      navigate("/ambassadors");
    }
  };

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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold mb-1">CRM</h1>
                <p className="text-muted-foreground">
                  Gérez vos clients, ambassadeurs et partenaires
                </p>
              </div>
              <Button onClick={() => navigate('/ambassadors/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvel ambassadeur
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="clients" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Clients</span>
                    </TabsTrigger>
                    <TabsTrigger value="ambassadors" className="flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4" />
                      <span>Ambassadeurs</span>
                    </TabsTrigger>
                    <TabsTrigger value="partners" className="flex items-center gap-2">
                      <BadgePercent className="h-4 w-4" />
                      <span>Partenaires</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="ambassadors" className="mt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">Ambassadeurs</CardTitle>
                        <CardDescription>
                          Gérez vos ambassadeurs et suivez leurs performances
                        </CardDescription>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="partners" className="mt-0">
                    <div>
                      <CardTitle className="text-xl">Partenaires</CardTitle>
                      <CardDescription>
                        Gérez vos relations partenaires
                      </CardDescription>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="clients" className="mt-0">
                    <div>
                      <CardTitle className="text-xl">Clients</CardTitle>
                      <CardDescription>
                        Gérez vos clients
                      </CardDescription>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
              <CardContent>
                {activeTab === "ambassadors" && <AmbassadorsList />}
                {activeTab === "partners" && <PartnersList />}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </Container>
    </PageTransition>
  );
};

export default AmbassadorsListPage;
