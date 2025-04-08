
import React from 'react';

const CatalogManagement = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Gestion du Catalogue</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600 mb-4">
          Cet espace permet de gérer les produits du catalogue.
        </p>
        <div className="flex justify-end">
          <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
            Ajouter un produit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CatalogManagement;
