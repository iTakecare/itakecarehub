
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryTabsProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  selectedCategory, 
  setSelectedCategory, 
  categories 
}) => {
  return (
    <TabsList className="w-auto inline-flex">
      <TabsTrigger value="all" onClick={() => setSelectedCategory("all")}>
        Tous
      </TabsTrigger>
      {categories.map((category) => (
        <TabsTrigger 
          key={category} 
          value={category} 
          onClick={() => setSelectedCategory(category)}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

export default CategoryTabs;
