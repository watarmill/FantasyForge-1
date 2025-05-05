import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Property } from "@shared/schema";
import { MainLayout } from "@/components/layout/MainLayout";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map } from "@/components/ui/map";
import { Grid, MapPin, Loader2 } from "lucide-react";

export default function PropertiesPage() {
  const [location] = useLocation();
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  
  // Parse URL search params
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const initialFilters = {
    search: searchParams.get("search") || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    bedrooms: searchParams.get("bedrooms") || undefined,
    bathrooms: searchParams.get("bathrooms") || undefined,
    propertyType: searchParams.get("propertyType") || undefined,
    status: searchParams.get("status") || undefined,
  };

  // Build query string for API request
  const buildQueryString = () => {
    const params = new URLSearchParams();
    Object.entries(initialFilters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
    return params.toString();
  };

  // Fetch properties
  const { data: properties, isLoading, isError } = useQuery<Property[]>({
    queryKey: [`/api/properties?${buildQueryString()}`],
  });

  // Fetch favorites for the current user
  const { data: favorites } = useQuery<{ propertyId: number }[]>({
    queryKey: ["/api/favorites"],
  });

  // Check if a property is favorited
  const isFavorited = (propertyId: number) => {
    return favorites?.some(fav => fav.propertyId === propertyId) || false;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Properties</h1>
            <p className="text-muted-foreground">
              {isLoading ? (
                "Finding properties that match your criteria..."
              ) : properties?.length ? (
                `Found ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`
              ) : (
                "No properties match your current filters"
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "map")}>
              <TabsList>
                <TabsTrigger value="grid" className="flex items-center gap-1">
                  <Grid className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Map</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <PropertyFilters initialFilters={initialFilters} />
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        ) : isError ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <p className="text-destructive font-medium">Failed to load properties. Please try again.</p>
            <Button variant="destructive" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties && properties.length > 0 ? (
                  properties.map((property) => (
                    <PropertyCard 
                      key={property.id} 
                      property={property} 
                      isFavorited={isFavorited(property.id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center">
                    <p className="text-muted-foreground mb-4">No properties match your current criteria.</p>
                    <Button onClick={() => window.location.href = "/properties"}>
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[700px] rounded-lg overflow-hidden border">
                <Map 
                  center={
                    properties && properties.length > 0 && properties[0].latitude && properties[0].longitude 
                      ? { lat: Number(properties[0].latitude), lng: Number(properties[0].longitude) }
                      : { lat: 40.7128, lng: -74.006 } // Default to NYC
                  }
                  markers={properties?.map(p => ({
                    id: p.id,
                    lat: Number(p.latitude || 40.7128),
                    lng: Number(p.longitude || -74.006),
                    title: p.title,
                    popup: `
                      <div style="max-width: 200px">
                        <strong>${p.title}</strong><br/>
                        ${p.price ? `$${Number(p.price).toLocaleString()}` : ''}
                        <div style="margin-top: 8px">
                          <a href="/properties/${p.id}" style="color: #0066CC; text-decoration: underline;">
                            View Details
                          </a>
                        </div>
                      </div>
                    `
                  })) || []}
                  height="700px"
                />
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
