
import React from "react";
import Container from "@/components/layout/Container";

const PartnersSection = () => {
  const partners = [
    { id: 1, name: "Sitemark" },
    { id: 2, name: "Sitemark" },
    { id: 3, name: "Sitemark" },
    { id: 4, name: "Sitemark" },
    { id: 5, name: "Sitemark" },
    { id: 6, name: "Sitemark" },
  ];

  return (
    <section className="py-16 bg-white mt-12">
      <Container maxWidth="custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Ils nous font confiance</h2>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
          {partners.map((partner) => (
            <div key={partner.id} className="flex items-center">
              <span className="text-2xl font-bold">✱ {partner.name}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default PartnersSection;
