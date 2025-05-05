import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { AgentCard } from "@/components/agents/AgentCard";
import { Map } from "@/components/ui/map";
import { Property, User, InsertMessage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import {
  Heart,
  Share2,
  Bed,
  Bath,
  SquareIcon,
  Calendar,
  Check,
  MapPin,
  Home,
  Pencil,
  Trash2,
  MessageSquare,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";

// Form schema for message
const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export default function PropertyDetailPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/properties/:id");
  const { toast } = useToast();
  const { user } = useAuth();
  const [isContactOpen, setIsContactOpen] = useState(false);
  
  // Fetch property details
  const { data: property, isLoading: isPropertyLoading, isError: isPropertyError } = useQuery<Property>({
    queryKey: [`/api/properties/${params?.id}`],
    enabled: !!params?.id,
  });

  // Fetch property owner details if property is loaded
  const { data: owner, isLoading: isOwnerLoading } = useQuery<User>({
    queryKey: [`/api/users/${property?.ownerId}`],
    enabled: !!property?.ownerId,
  });

  // Check if this property is in user's favorites
  const { data: favoriteStatus, isLoading: isFavoriteLoading } = useQuery<boolean>({
    queryKey: [`/api/favorites/check/${params?.id}`],
    enabled: !!params?.id && !!user,
  });

  // Toggle favorite status mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to favorite properties");
      if (!property) throw new Error("Property not found");
      
      if (favoriteStatus) {
        // Remove from favorites
        await apiRequest("DELETE", `/api/favorites/${property.id}`);
      } else {
        // Add to favorites
        await apiRequest("POST", "/api/favorites", {
          userId: user.id,
          propertyId: property.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/check/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      
      toast({
        title: favoriteStatus ? "Removed from favorites" : "Added to favorites",
        description: favoriteStatus 
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

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async () => {
      if (!property) throw new Error("Property not found");
      await apiRequest("DELETE", `/api/properties/${property.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Property deleted",
        description: "The property has been successfully deleted",
      });
      navigate("/properties");
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Share property
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: property?.title || "Check out this property",
          text: "I found this amazing property on EstateHub!",
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Property link copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Handle send message form
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormValues) => {
      if (!user) throw new Error("You must be logged in to send messages");
      if (!property) throw new Error("Property not found");
      if (!owner) throw new Error("Property owner not found");
      
      const messageData: InsertMessage = {
        senderId: user.id,
        receiverId: owner.id,
        propertyId: property.id,
        content: data.content,
      };
      
      await apiRequest("POST", "/api/messages", messageData);
    },
    onSuccess: () => {
      form.reset();
      setIsContactOpen(false);
      
      toast({
        title: "Message sent",
        description: `Your message has been sent to ${owner?.fullName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmitMessage = (data: MessageFormValues) => {
    sendMessageMutation.mutate(data);
  };

  // Format currency
  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  // Check if current user is the property owner
  const isOwner = user && property && user.id === property.ownerId;
  
  // Loading state
  if (isPropertyLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  // Error state
  if (isPropertyError || !property) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <X className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist or has been removed</p>
          <Button onClick={() => navigate("/properties")}>
            Browse Properties
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Back link */}
          <div>
            <Button variant="link" className="pl-0" onClick={() => navigate("/properties")}>
              <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
              Back to Properties
            </Button>
          </div>
          
          {/* Gallery */}
          <PropertyGallery images={property.images} title={property.title} />
          
          {/* Property Title & Actions */}
          <div>
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold">{property.title}</h1>
                <p className="text-lg text-muted-foreground">
                  {property.address}, {property.city}, {property.state} {property.zipCode}
                </p>
              </div>
              <div className="flex gap-2">
                {isOwner ? (
                  <>
                    <Button variant="outline" size="icon" onClick={() => navigate(`/properties/${property.id}/edit`)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this property listing.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deletePropertyMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deletePropertyMutation.isPending ? 
                              <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
                              <Trash2 className="h-4 w-4 mr-2" />
                            }
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <>
                    {user && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={favoriteStatus ? "text-red-500" : ""}
                        onClick={() => toggleFavoriteMutation.mutate()}
                        disabled={isFavoriteLoading || toggleFavoriteMutation.isPending}
                      >
                        {toggleFavoriteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart className={favoriteStatus ? "fill-current" : ""} />
                        )}
                      </Button>
                    )}
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="bg-primary text-primary-foreground text-sm">
                {formatPrice(property.price)}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
              </Badge>
              <Badge variant={property.status === "active" ? "default" : "outline"} className="text-sm">
                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          {/* Property Details Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="py-4 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Bed className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-medium">{property.bedrooms}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Bath className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-medium">{property.bathrooms}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <SquareIcon className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Area</p>
                      <p className="font-medium">{property.area} sq ft</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Year Built</p>
                      <p className="font-medium">{property.yearBuilt || "Not specified"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="py-4">
              <h3 className="text-xl font-semibold mb-4">Property Features</h3>
              
              {property.features && property.features.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                  {property.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature.charAt(0).toUpperCase() + feature.slice(1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific features listed for this property.</p>
              )}
            </TabsContent>
            
            <TabsContent value="location" className="py-4 space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-3">Location</h3>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-muted-foreground">
                    {property.address}, {property.city}, {property.state} {property.zipCode}, {property.country}
                  </p>
                </div>
              </div>
              
              {(property.latitude && property.longitude) ? (
                <div className="h-[400px] rounded-lg overflow-hidden border">
                  <Map 
                    center={{ lat: Number(property.latitude), lng: Number(property.longitude) }}
                    markers={[{
                      id: property.id,
                      lat: Number(property.latitude),
                      lng: Number(property.longitude),
                      title: property.title,
                    }]}
                    height="400px"
                  />
                </div>
              ) : (
                <div className="bg-muted/50 p-6 rounded-lg text-center">
                  <Home className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Map location not available for this property.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">
                {formatPrice(property.price)}
              </CardTitle>
              <CardDescription>
                {property.propertyType === "commercial" ? "Commercial property" : "Residential property"} for {property.status === "rented" ? "rent" : "sale"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Type</span>
                  <span className="font-medium capitalize">{property.propertyType}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bedrooms</span>
                  <span className="font-medium">{property.bedrooms}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bathrooms</span>
                  <span className="font-medium">{property.bathrooms}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area</span>
                  <span className="font-medium">{property.area} sq ft</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{property.status}</span>
                </div>
              </div>
            </CardContent>
            {!isOwner && user && (
              <CardFooter>
                <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Agent
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contact About {property.title}</DialogTitle>
                      <DialogDescription>
                        Send a message to the agent about this property.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitMessage)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder="I'm interested in this property and would like to schedule a viewing..."
                                  className="resize-none min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={sendMessageMutation.isPending}
                          >
                            {sendMessageMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Send Message
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            )}
          </Card>
          
          {/* Agent Card */}
          {owner && (
            <div className="sticky top-24">
              <h3 className="text-lg font-semibold mb-3">Listed By</h3>
              <AgentCard agent={owner} propertyCount={1} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
