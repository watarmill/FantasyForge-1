import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Property, User } from "@shared/schema";
import { MainLayout } from "@/components/layout/MainLayout";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { AgentCard } from "@/components/agents/AgentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Map } from "@/components/ui/map";
import { 
  Search, 
  Building, 
  Home, 
  Building2, 
  Warehouse, 
  MapPin, 
  TrendingUp,
  Users
} from "lucide-react";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: featuredProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties?featured=true&limit=3"]
  });
  
  const { data: topAgents } = useQuery<User[]>({
    queryKey: ["/api/users?role=agent&limit=4"]
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/properties?search=${encodeURIComponent(searchTerm)}`;
  };

  return (
    <MainLayout fullWidth>
      {/* Hero section */}
      <section className="relative h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&q=80&w=1600" 
            alt="Modern luxury home" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="container relative z-10 text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Find Your Dream Home
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Discover the perfect property with our advanced search tools and expert agents.
            </p>
            
            <form onSubmit={handleSearchSubmit} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
                  <Input 
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                    placeholder="Enter location, property type, or keyword" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button type="submit" className="md:w-auto">
                  Search Properties
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
      
      {/* Property types section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-2">
            Browse by Property Type
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Explore our wide range of properties to find what suits your needs
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/properties?propertyType=house">
              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Houses</h3>
                <p className="text-sm text-muted-foreground">
                  Single-family homes with diverse styles and sizes
                </p>
              </div>
            </Link>
            
            <Link href="/properties?propertyType=apartment">
              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Apartments</h3>
                <p className="text-sm text-muted-foreground">
                  Urban living with modern amenities
                </p>
              </div>
            </Link>
            
            <Link href="/properties?propertyType=condo">
              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Condos</h3>
                <p className="text-sm text-muted-foreground">
                  Shared ownership with premium facilities
                </p>
              </div>
            </Link>
            
            <Link href="/properties?propertyType=commercial">
              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Warehouse className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Commercial</h3>
                <p className="text-sm text-muted-foreground">
                  Office spaces, retail, and business properties
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Featured properties section */}
      <section className="py-16">
        <div className="container">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Featured Properties
              </h2>
              <p className="text-muted-foreground">
                Handpicked properties that you might love
              </p>
            </div>
            <Link href="/properties">
              <Button variant="outline">View All Properties</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties ? (
              featuredProperties.length > 0 ? (
                featuredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No featured properties available at the moment.</p>
                </div>
              )
            ) : (
              // Loading state
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-muted rounded-lg h-[400px] animate-pulse"></div>
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* Map section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-10">
            <div className="md:w-1/2">
              <div className="sticky top-24">
                <h2 className="text-3xl font-bold mb-4">
                  Find Properties Near You
                </h2>
                <p className="text-muted-foreground mb-6">
                  Explore available properties in your area with our interactive map. Discover neighborhoods, proximity to amenities, and find the perfect location for your new home.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Location Based Search</h3>
                      <p className="text-sm text-muted-foreground">
                        Search properties by drawing on the map or entering your preferred location.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Real-Time Updates</h3>
                      <p className="text-sm text-muted-foreground">
                        View property details directly on the map with real-time availability updates.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Market Insights</h3>
                      <p className="text-sm text-muted-foreground">
                        Get neighborhood statistics and property value trends for informed decisions.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Link href="/properties">
                  <Button className="mt-8">
                    Explore Map View
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="md:w-1/2 h-[500px]">
              <Map 
                markers={featuredProperties?.map(p => ({
                  id: p.id,
                  lat: Number(p.latitude || 40.7128),
                  lng: Number(p.longitude || -74.006),
                  title: p.title,
                  popup: `<strong>${p.title}</strong><br/>${p.price ? `$${Number(p.price).toLocaleString()}` : ''}`
                })) || []}
                height="500px"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Top agents section */}
      <section className="py-16">
        <div className="container">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Meet Our Top Agents
              </h2>
              <p className="text-muted-foreground">
                Experienced professionals ready to help you
              </p>
            </div>
            <Link href="/agents">
              <Button variant="outline">View All Agents</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topAgents ? (
              topAgents.length > 0 ? (
                topAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} propertyCount={Math.floor(Math.random() * 20) + 1} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No agents available at the moment.</p>
                </div>
              )
            ) : (
              // Loading state
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-muted rounded-lg h-[300px] animate-pulse"></div>
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-20 bg-primary text-white">
        <div className="container text-center">
          <div className="max-w-3xl mx-auto">
            <Users className="h-16 w-16 mx-auto mb-6 text-white/80" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Your Perfect Property?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join thousands of satisfied customers who found their dream homes with SafeHaven Realty. 
              Register now to save your searches, get personalized alerts, and connect with agents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button className="bg-white text-primary hover:bg-white/90">
                  Create an Account
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Browse Properties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
