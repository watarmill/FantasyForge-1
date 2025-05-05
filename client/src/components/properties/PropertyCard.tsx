import { Link } from "wouter";
import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Property, InsertFavorite } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PropertyCardProps {
  property: Property;
  isFavorited?: boolean;
}

export function PropertyCard({ property, isFavorited }: PropertyCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited || false);

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(property.price));

  const statusColors = {
    active: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    pending: "bg-amber-100 text-amber-800 hover:bg-amber-200",
    sold: "bg-red-100 text-red-800 hover:bg-red-200",
    rented: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  };
  
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to favorite properties");
      
      if (favorited) {
        // Remove from favorites
        await apiRequest("DELETE", `/api/favorites/${property.id}`);
      } else {
        // Add to favorites
        const favoriteData: InsertFavorite = {
          userId: user.id,
          propertyId: property.id,
        };
        await apiRequest("POST", "/api/favorites", favoriteData);
      }
    },
    onSuccess: () => {
      setFavorited(!favorited);
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: favorited ? "Removed from favorites" : "Added to favorites",
        description: favorited 
          ? "Property has been removed from your favorites"
          : "Property has been added to your favorites",
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteMutation.mutate();
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case 'apartment': return 'Apartment';
      case 'house': return 'House';
      case 'condo': return 'Condo';
      case 'townhouse': return 'Townhouse';
      case 'land': return 'Land';
      case 'commercial': return 'Commercial';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <Link href={`/properties/${property.id}`}>
      <Card 
        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-48 overflow-hidden">
          <img 
            src={property.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&q=80&w=800'} 
            alt={property.title}
            className={cn(
              "w-full h-full object-cover",
              isHovered && "scale-105 transition-transform duration-300"
            )}
          />
          {user && (
            <button
              onClick={handleFavoriteClick}
              className={cn(
                "absolute top-3 right-3 p-2 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white transition-colors",
                favorited ? "text-red-500" : "text-gray-600"
              )}
              aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={favorited ? "fill-current" : ""} size={18} />
            </button>
          )}
          <Badge 
            variant="outline" 
            className={cn(
              "absolute bottom-3 left-3",
              statusColors[property.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
            )}
          >
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </Badge>
        </div>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg font-semibold truncate">{property.title}</CardTitle>
          <CardDescription className="truncate">{property.address}, {property.city}, {property.state}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-1">
          <div className="flex gap-2 mt-2 mb-3 flex-wrap">
            <Badge variant="secondary" className="font-normal">
              {getPropertyTypeLabel(property.propertyType)}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {property.area} sq ft
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 border-t flex justify-between items-center">
          <span className="text-lg font-bold text-primary">{formattedPrice}</span>
          <Button variant="outline" size="sm">View Details</Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
