import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Property } from "@shared/schema";
import { Search, Heart, Loader2, X } from "lucide-react";
import { Link } from "wouter";

export default function DashboardFavoritesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch favorite properties
  const { data: favoriteProperties, isLoading, isError } = useQuery<Property[]>({
    queryKey: ["/api/favorites/properties"],
  });
  
  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      await apiRequest("DELETE", `/api/favorites/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      
      toast({
        title: "Removed from favorites",
        description: "Property has been removed from your favorites",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter properties based on search term
  const filteredProperties = favoriteProperties?.filter(property => {
    return (
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Favorites</h1>
          <p className="text-muted-foreground">
            Manage your favorite properties
          </p>
        </div>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search favorites..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <X className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive font-medium mb-2">Failed to load favorite properties</p>
            <Button 
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/favorites/properties"] })}
            >
              Try Again
            </Button>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            {searchTerm ? (
              <>
                <p className="text-muted-foreground mb-4">No properties match your search criteria</p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">You haven't added any properties to your favorites yet</p>
                <Link href="/properties">
                  <Button>
                    Browse Properties
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                isFavorited={true}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
