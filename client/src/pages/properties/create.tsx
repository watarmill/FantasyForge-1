import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { Property } from "@shared/schema";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreatePropertyPage() {
  const [, navigate] = useLocation();
  
  const handleSuccess = (property: Property) => {
    navigate(`/properties/${property.id}`);
  };
  
  return (
    <MainLayout>
      <div>
        <div className="mb-8">
          <Button variant="link" className="pl-0" onClick={() => navigate("/properties")}>
            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
            Back to Properties
          </Button>
          <h1 className="text-3xl font-bold mt-2">Create New Listing</h1>
          <p className="text-muted-foreground">
            Add details about your property to create a new listing
          </p>
        </div>
        
        <PropertyForm onSuccess={handleSuccess} />
      </div>
    </MainLayout>
  );
}
