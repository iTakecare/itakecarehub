
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const generateOfferPdf = async (offer) => {
  try {
    console.log("Generating PDF for offer:", offer.id);
    
    // Si un modèle est spécifié dans l'offre, l'utiliser
    let templateId = offer.__template?.id;
    
    // Si aucun modèle n'est spécifié, vérifier si l'ambassadeur ou le partenaire a un modèle assigné
    if (!templateId) {
      if (offer.ambassador_id) {
        const { data: ambassador } = await supabase
          .from('ambassadors')
          .select('pdf_template_id')
          .eq('id', offer.ambassador_id)
          .single();
          
        if (ambassador?.pdf_template_id) {
          templateId = ambassador.pdf_template_id;
        }
      } else if (offer.partner_id) {
        const { data: partner } = await supabase
          .from('partners')
          .select('pdf_template_id')
          .eq('id', offer.partner_id)
          .single();
          
        if (partner?.pdf_template_id) {
          templateId = partner.pdf_template_id;
        }
      }
    }
    
    // Si aucun modèle n'est trouvé, utiliser le modèle par défaut
    if (!templateId) {
      console.log("No template specified, using default template");
      templateId = "default";
    }
    
    // Récupérer le modèle
    const { data: template, error: templateError } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('id', templateId)
      .single();
      
    if (templateError && templateError.code !== 'PGRST116') {
      console.error("Error fetching template:", templateError);
      throw new Error("Erreur lors de la récupération du modèle");
    }
    
    // Utiliser le modèle par défaut si le modèle spécifié n'est pas trouvé
    if (!template) {
      console.log("Specified template not found, using default template");
      const { data: defaultTemplate, error: defaultTemplateError } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('id', 'default')
        .single();
        
      if (defaultTemplateError) {
        console.error("Error fetching default template:", defaultTemplateError);
        throw new Error("Erreur lors de la récupération du modèle par défaut");
      }
      
      offer.__template = defaultTemplate;
    } else {
      offer.__template = template;
    }
    
    // Obtenir l'URL de l'API si définie
    const apiUrl = import.meta.env.VITE_API_URL;
    
    // Mode de développement ou API non configurée - générer un PDF fictif
    if (import.meta.env.DEV || !apiUrl) {
      console.log("Using mock PDF generation (dev mode or no API URL configured)");
      
      // Simuler un délai pour imiter l'API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // En développement, créer un blob PDF fictif pour le téléchargement
      const mockFilename = `offre_${offer.id}_${new Date().getTime()}.pdf`;
      console.log("Mock PDF generated:", mockFilename);
      
      // Retourner un objet avec le nom de fichier et un flag indiquant qu'il s'agit d'un mock
      return {
        filename: mockFilename,
        isMock: true,
        pdfUrl: null,
        pdfBlob: new Blob(['Contenu PDF fictif pour test en développement'], { type: 'application/pdf' })
      };
    }
    
    // Appel à l'API pour générer le PDF en mode production
    console.log("Making API request to:", `${apiUrl}/api/offer-pdf`);
    const response = await fetch(`${apiUrl}/api/offer-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify(offer),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from PDF API:", errorText);
      throw new Error(`Erreur lors de la génération du PDF: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("PDF generated successfully:", result);
    
    // Retourner les informations complètes (incluant l'URL du PDF s'il est disponible)
    return {
      filename: result.filename,
      isMock: false,
      pdfUrl: result.pdfUrl || null,
      pdfBlob: null
    };
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Erreur lors de la génération du PDF");
    
    // En cas d'erreur en développement, retourner un fichier fictif plutôt que de bloquer l'utilisateur
    if (import.meta.env.DEV) {
      console.log("Returning mock filename due to error in development mode");
      return {
        filename: `error_mock_${new Date().getTime()}.pdf`,
        isMock: true,
        pdfUrl: null,
        pdfBlob: new Blob(['Erreur PDF - Document fictif'], { type: 'application/pdf' })
      };
    }
    
    throw error;
  }
};

// Fonction utilitaire pour télécharger un fichier
export const downloadFile = (data, filename, mimeType = 'application/pdf') => {
  // Créer un élément a pour le téléchargement
  const downloadLink = document.createElement('a');
  
  // Si les données sont déjà un Blob, les utiliser directement
  let blob;
  if (data instanceof Blob) {
    blob = data;
  } else if (typeof data === 'string') {
    // Si c'est une URL, définir l'attribut href
    if (data.startsWith('http')) {
      downloadLink.href = data;
    } else {
      // Sinon, créer un blob à partir de la chaîne
      blob = new Blob([data], { type: mimeType });
    }
  } else {
    console.error("Type de données non pris en charge pour le téléchargement");
    return;
  }
  
  // Si nous avons un blob, créer une URL d'objet
  if (blob) {
    const blobUrl = URL.createObjectURL(blob);
    downloadLink.href = blobUrl;
    
    // Nettoyer l'URL de l'objet après le téléchargement
    downloadLink.onload = () => {
      URL.revokeObjectURL(blobUrl);
    };
  }
  
  // Définir le nom du fichier téléchargé
  downloadLink.download = filename;
  
  // Ajouter temporairement à la page et cliquer
  document.body.appendChild(downloadLink);
  downloadLink.click();
  
  // Supprimer le lien après le déclenchement du téléchargement
  document.body.removeChild(downloadLink);
};
