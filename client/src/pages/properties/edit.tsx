import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { Property } from "@shared/schema";
import { ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

export default function EditPropertyPage() {
  const [match, params] = useRoute("/properties/:id/edit");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const { data: property, isLoading, isError } = useQuery<Property>({
    queryKey: [`/api/properties/${params?.id}`],
    enabled: !!params?.id,
  });
  
  const handleSuccess = (property: Property) => {
    navigate(`/properties/${property.id}`);
  };
  
  // Check if user has permission to edit this property
  const canEdit = user && property && (user.id === property.ownerId || user.role === "admin");
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (isError || !property) {
    return (
      <MainLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            The property you're trying to edit could not be found.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/properties")}>
          Back to Properties
        </Button>
      </MainLayout>
    );
  }
  
  if (!canEdit) {
    return (
      <MainLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Permission Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to edit this property.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate(`/properties/${property.id}`)}>
          View Property
        </Button>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div>
        <div className="mb-8">
          <Button variant="link" className="pl-0" onClick={() => navigate(`/properties/${property.id}`)}>
            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
            Back to Property
          </Button>
          <h1 className="text-3xl font-bold mt-2">Edit Listing</h1>
          <p className="text-muted-foreground">
            Update details for {property.title}
          </p>
        </div>
        
        <PropertyForm property={property} onSuccess={handleSuccess} />
      </div>
    </MainLayout>
  );
}
