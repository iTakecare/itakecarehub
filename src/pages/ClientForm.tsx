
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { createClient, getClientById, updateClient } from "@/services/clientService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Container from "@/components/layout/Container";
import PageTransition from "@/components/layout/PageTransition";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const ClientForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user, isAmbassador } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const clientId = params.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (clientId) {
      setIsEditMode(true);
      setIsLoading(true);
      getClientById(clientId).then(client => {
        if (client) {
          form.reset({
            name: client.name,
            email: client.email || "",
            company: client.company || "",
            phone: client.phone || "",
            address: client.address || "",
            notes: client.notes || ""
          });
        } else {
          toast.error("Client introuvable");
          navigateBack();
        }
        setIsLoading(false);
      }).catch(error => {
        console.error("Erreur lors du chargement du client:", error);
        toast.error("Erreur lors du chargement du client");
        setIsLoading(false);
        navigateBack();
      });
    }
  }, [clientId, form]);

  const navigateBack = () => {
    if (isAmbassador()) {
      navigate("/ambassador/clients");
    } else {
      navigate("/clients");
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure name is provided (required by CreateClientData)
      const clientData = {
        name: data.name,
        email: data.email || undefined,
        company: data.company || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined
      };
      
      let result;
      
      if (isEditMode && clientId) {
        // Update existing client
        result = await updateClient(clientId, clientData);
        if (result) {
          toast.success("Client mis à jour avec succès");
        }
      } else {
        // Create new client
        result = await createClient(clientData);
        if (result) {
          toast.success("Client créé avec succès");
          
          // Si l'utilisateur est un ambassadeur, associer le client à l'ambassadeur
          if (isAmbassador() && user?.ambassador_id) {
            const { error: linkError } = await supabase
              .from("ambassador_clients")
              .insert({
                ambassador_id: user.ambassador_id,
                client_id: result.id
              });
              
            if (linkError) {
              console.error("Erreur lors de l'association du client à l'ambassadeur:", linkError);
              toast.error("Erreur lors de l'association du client à l'ambassadeur");
            }
          }
        }
      }
      
      // Redirection appropriée
      if (result) {
        if (isAmbassador()) {
          // Rediriger vers la page clients de l'ambassadeur
          navigate("/ambassador/clients");
        } else {
          // Redirection admin
          navigate("/clients");
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'opération sur le client:", error);
      toast.error(isEditMode ? "Erreur lors de la mise à jour du client" : "Erreur lors de la création du client");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <Container>
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Container>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Container>
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{isEditMode ? "Modifier le client" : "Créer un client"}</CardTitle>
              <CardDescription>
                {isEditMode ? "Modifiez les informations du client." : "Ajoutez un nouveau client à votre liste."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du client" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email du client" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Société</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de la société" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="Numéro de téléphone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="Adresse du client" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informations supplémentaires"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={navigateBack}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isEditMode ? "Mise à jour..." : "Enregistrement..."}
                        </>
                      ) : (
                        isEditMode ? "Mettre à jour" : "Enregistrer"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </Container>
    </PageTransition>
  );
};

export default ClientForm;
