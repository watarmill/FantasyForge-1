import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { Property, User, Message, Favorite } from "@shared/schema";
import { Building, Heart, MessageSquare, Plus, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch user's properties if they are an agent
  const { data: properties, isLoading: isPropertiesLoading } = useQuery<Property[]>({
    queryKey: [`/api/properties?ownerId=${user?.id}&limit=3`],
    enabled: user?.role === "agent",
  });
  
  // Fetch user's favorites
  const { data: favoritesData, isLoading: isFavoritesLoading } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites"],
  });
  
  // Fetch favorite properties details
  const { data: favoriteProperties, isLoading: isFavoritePropertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/favorites/properties?limit=3"],
    enabled: !!favoritesData && favoritesData.length > 0,
  });
  
  // Fetch messages
  const { data: messages, isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages?limit=5"],
  });
  
  // Fetch user names for messages
  const { data: messageSenders } = useQuery<{[key: number]: User}>({
    queryKey: ["/api/users/batch"],
    queryFn: async () => {
      if (!messages || messages.length === 0) return {};
      
      const senderIds = [...new Set(messages.map(m => m.senderId))];
      const response = await fetch(`/api/users/batch?ids=${senderIds.join(',')}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      const users = await response.json();
      return users.reduce((acc: {[key: number]: User}, user: User) => {
        acc[user.id] = user;
        return acc;
      }, {});
    },
    enabled: !!messages && messages.length > 0,
  });
  
  // Placeholder loading elements
  const LoadingCard = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CardContent>
    </Card>
  );
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };
  
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Properties Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span>My Properties</span>
                </div>
                <span className="text-primary">
                  {user?.role === "agent" ? properties?.length || 0 : 0}
                </span>
              </CardTitle>
              <CardDescription>
                {user?.role === "agent" 
                  ? "Properties you have listed" 
                  : "Create an agent account to list properties"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/properties">
                <Button className="w-full" variant={user?.role === "agent" ? "default" : "outline"}>
                  {user?.role === "agent" ? (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      View All Properties
                    </>
                  ) : (
                    "Become an Agent"
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Favorites Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Favorites</span>
                </div>
                <span className="text-primary">{favoritesData?.length || 0}</span>
              </CardTitle>
              <CardDescription>
                Properties you've saved to favorites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/favorites">
                <Button className="w-full">
                  View All Favorites
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Messages Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>Messages</span>
                </div>
                <span className="text-primary">{messages?.length || 0}</span>
              </CardTitle>
              <CardDescription>
                Communication with agents and buyers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/messages">
                <Button className="w-full">
                  View All Messages
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Properties */}
        {user?.role === "agent" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Recent Properties</h2>
              <Link href="/dashboard/properties">
                <Button variant="link">View All</Button>
              </Link>
            </div>
            
            {isPropertiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {properties.map(property => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">You haven't listed any properties yet</p>
                  <Link href="/properties/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Listing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Favorite Properties */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Favorites</h2>
            <Link href="/dashboard/favorites">
              <Button variant="link">View All</Button>
            </Link>
          </div>
          
          {isFavoritesLoading || isFavoritePropertiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : favoriteProperties && favoriteProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {favoriteProperties.map(property => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  isFavorited={true}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground mb-4">You haven't added any properties to your favorites yet</p>
                <Link href="/properties">
                  <Button>
                    Browse Properties
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Recent Messages */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Recent Messages</h2>
            <Link href="/dashboard/messages">
              <Button variant="link">View All</Button>
            </Link>
          </div>
          
          {isMessagesLoading ? (
            <LoadingCard />
          ) : messages && messages.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {messages.slice(0, 5).map(message => (
                    <li key={message.id} className="p-4 hover:bg-muted/50">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">
                          {messageSenders?.[message.senderId]?.fullName || `User #${message.senderId}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {message.content}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">You don't have any messages yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
