
import React, { useState } from 'react';
import { ChevronRight, CircleCheck } from 'lucide-react';
import CompanyInfoForm from './CompanyInfoForm';
import ContactInfoForm from './ContactInfoForm';
import RequestSummary from './RequestSummary';

interface RequestStepsProps {
  companyId?: string;
}

const RequestSteps = ({ companyId }: RequestStepsProps) => {
  const [step, setStep] = useState(1);
  
  const [companyFormData, setCompanyFormData] = useState({
    company: '',
    vat_number: '',
    company_verified: false,
    is_vat_exempt: false,
    country: 'BE',
    email: '',
    address: '',
    city: '',
    postal_code: ''
  });
  
  const [contactFormData, setContactFormData] = useState({
    name: '',
    phone: '',
    email: '',
    has_client_account: false,
    address: '',
    city: '',
    postal_code: '',
    country: '',
    has_different_shipping_address: false,
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: ''
  });
  
  const handleCompanyDataUpdate = (data: Partial<typeof companyFormData>) => {
    setCompanyFormData(prev => ({ ...prev, ...data }));
  };
  
  const handleContactDataUpdate = (data: Partial<typeof contactFormData>) => {
    setContactFormData(prev => ({ ...prev, ...data }));
  };
  
  const handleNextStep = () => {
    if (step === 1) {
      // When moving from company to contact step, pre-fill the address fields in contactFormData
      // if they were populated from VIES
      handleContactDataUpdate({
        address: companyFormData.address || '',
        city: companyFormData.city || '',
        postal_code: companyFormData.postal_code || '',
        country: companyFormData.country || ''
      });
    }
    setStep(prev => prev + 1);
  };
  
  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center rounded-full w-8 h-8 ${step > 1 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            {step > 1 ? (
              <CircleCheck className="w-5 h-5" />
            ) : (
              <span className="text-sm font-medium">1</span>
            )}
          </div>
          <div className={`h-0.5 flex-1 mx-2 ${step > 1 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center rounded-full w-8 h-8 ${step > 2 ? 'bg-green-100 text-green-600' : step === 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            {step > 2 ? (
              <CircleCheck className="w-5 h-5" />
            ) : (
              <span className="text-sm font-medium">2</span>
            )}
          </div>
          <div className={`h-0.5 flex-1 mx-2 ${step > 2 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center rounded-full w-8 h-8 ${step === 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            <span className="text-sm font-medium">3</span>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <div className={`w-1/3 text-center ${step === 1 ? 'font-medium text-blue-600' : step > 1 ? 'text-green-600' : ''}`}>Entreprise</div>
          <div className={`w-1/3 text-center ${step === 2 ? 'font-medium text-blue-600' : step > 2 ? 'text-green-600' : ''}`}>Contact</div>
          <div className={`w-1/3 text-center ${step === 3 ? 'font-medium text-blue-600' : ''}`}>Récapitulatif</div>
        </div>
      </div>
      
      <div className="min-h-[400px]">
        {step === 1 && (
          <CompanyInfoForm 
            formData={companyFormData} 
            updateFormData={handleCompanyDataUpdate}
            onNext={handleNextStep}
          />
        )}
        
        {step === 2 && (
          <ContactInfoForm
            formData={contactFormData}
            updateFormData={handleContactDataUpdate}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            initialEmail={companyFormData.email}
          />
        )}
        
        {step === 3 && (
          <RequestSummary
            companyData={companyFormData}
            contactData={contactFormData}
            onBack={handlePrevStep}
            companyId={companyId}
          />
        )}
      </div>
    </div>
  );
};

export default RequestSteps;
