import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Property, insertPropertySchema } from "@shared/schema";
import { Map } from "@/components/ui/map";
import { MapPin, X, Plus, Upload } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

// Validation schema based on the database schema
const FormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip Code is required"),
  country: z.string().min(2, "Country is required"),
  propertyType: z.enum([
    "apartment", 
    "house", 
    "condo", 
    "townhouse", 
    "land", 
    "commercial"
  ]),
  status: z.enum(["active", "pending", "sold", "rented"]),
  bedrooms: z.coerce.number().min(0, "Bedrooms cannot be negative"),
  bathrooms: z.coerce.number().min(0, "Bathrooms cannot be negative"),
  area: z.coerce.number().positive("Area must be a positive number"),
  yearBuilt: z.coerce.number().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1, "At least one image is required"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface PropertyFormProps {
  property?: Property;
  onSuccess: (property: Property) => void;
}

const propertyFeatures = [
  { id: "garage", label: "Garage" },
  { id: "pool", label: "Swimming Pool" },
  { id: "garden", label: "Garden" },
  { id: "balcony", label: "Balcony" },
  { id: "elevator", label: "Elevator" },
  { id: "parking", label: "Parking" },
  { id: "airConditioning", label: "Air Conditioning" },
  { id: "heating", label: "Heating" },
  { id: "fireplace", label: "Fireplace" },
  { id: "security", label: "Security System" },
  { id: "laundry", label: "Laundry Room" },
  { id: "furnished", label: "Furnished" },
  { id: "petFriendly", label: "Pet Friendly" },
  { id: "gym", label: "Gym" },
  { id: "spa", label: "Spa" },
];

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 });
  
  // Initialize form with property data if available
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: property ? {
      ...property,
      features: property.features || [],
      images: property.images || [],
      yearBuilt: property.yearBuilt || undefined,
      latitude: property.latitude ? Number(property.latitude) : undefined,
      longitude: property.longitude ? Number(property.longitude) : undefined,
    } : {
      title: "",
      description: "",
      price: 0,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      propertyType: "house",
      status: "active",
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      features: [],
      images: [],
    },
  });

  // Update map when lat/lng changes
  const watchLat = form.watch("latitude");
  const watchLng = form.watch("longitude");
  
  useEffect(() => {
    if (watchLat && watchLng) {
      setMapCenter({ lat: watchLat, lng: watchLng });
    }
  }, [watchLat, watchLng]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create or edit properties",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const propertyData = {
        ...data,
        ownerId: user.id,
      };

      let response: Response;
      if (property) {
        // Update property
        response = await apiRequest("PUT", `/api/properties/${property.id}`, propertyData);
      } else {
        // Create property
        response = await apiRequest("POST", "/api/properties", propertyData);
      }

      const savedProperty = await response.json();
      
      toast({
        title: property ? "Property updated" : "Property created",
        description: property 
          ? "Your property has been updated successfully" 
          : "Your property has been created successfully",
      });
      
      onSuccess(savedProperty);
    } catch (error) {
      console.error("Failed to save property", error);
      toast({
        title: "Failed to save property",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle fake image upload (in a real app, this would upload to a cloud service)
  const handleImageUpload = () => {
    // In a real app, this would open a file picker and handle the upload
    const dummyImages = [
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&q=80&w=800",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&q=80&w=800",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&q=80&w=800"
    ];
    
    const currentImages = form.getValues("images") || [];
    if (currentImages.length < 10) {
      const randomImage = dummyImages[Math.floor(Math.random() * dummyImages.length)];
      form.setValue("images", [...currentImages, randomImage]);
    } else {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 10 images",
        variant: "destructive",
      });
    }
  };

  // Function to remove an image
  const removeImage = (index: number) => {
    const currentImages = [...form.getValues("images")];
    currentImages.splice(index, 1);
    form.setValue("images", currentImages);
  };

  // Function to update coordinates based on address
  const updateCoordinates = async () => {
    const address = form.getValues("address");
    const city = form.getValues("city");
    const state = form.getValues("state");
    const country = form.getValues("country");
    
    if (!address || !city || !state) {
      toast({
        title: "Address incomplete",
        description: "Please fill in address, city, and state before generating coordinates",
        variant: "destructive",
      });
      return;
    }
    
    const fullAddress = `${address}, ${city}, ${state}, ${country}`;
    
    // In a real app, this would call a geocoding service
    // For demo, we'll use some random coordinates near the requested area
    const baseCoords = {
      'New York': { lat: 40.7128, lng: -74.006 },
      'Los Angeles': { lat: 34.0522, lng: -118.2437 },
      'Chicago': { lat: 41.8781, lng: -87.6298 },
      'Houston': { lat: 29.7604, lng: -95.3698 },
      'Phoenix': { lat: 33.4484, lng: -112.0740 },
    }[city] || { lat: 40.7128, lng: -74.006 };
    
    // Add some randomness
    const latitude = baseCoords.lat + (Math.random() - 0.5) * 0.1;
    const longitude = baseCoords.lng + (Math.random() - 0.5) * 0.1;
    
    form.setValue("latitude", latitude);
    form.setValue("longitude", longitude);
    setMapCenter({ lat: latitude, lng: longitude });
    
    toast({
      title: "Coordinates updated",
      description: `Generated coordinates for ${fullAddress}`,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Accordion type="multiple" defaultValue={["basics", "details", "location", "features", "media"]}>
          <AccordionItem value="basics">
            <AccordionTrigger>Basic Information</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Beautiful Family Home with Garden" {...field} />
                        </FormControl>
                        <FormDescription>
                          Create a compelling title that highlights key features
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the property in detail..." 
                            {...field} 
                            rows={5} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include information about the property, neighborhood, and special features
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="condo">Condo</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="rented">Rented</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={(e) => {
                            const value = e.target.value === "" ? "0" : e.target.value;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="details">
            <AccordionTrigger>Property Details</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={(e) => {
                            const value = e.target.value === "" ? "0" : e.target.value;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          step="0.5"
                          {...field} 
                          onChange={(e) => {
                            const value = e.target.value === "" ? "0" : e.target.value;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (sq ft)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={(e) => {
                            const value = e.target.value === "" ? "0" : e.target.value;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="yearBuilt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Built</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Optional" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : e.target.value;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="location">
            <AccordionTrigger>Location</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="md:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium">Map Location</h4>
                      <p className="text-xs text-muted-foreground">
                        Property coordinates for map display
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={updateCoordinates}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Generate from Address
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="any" 
                              placeholder="40.7128" 
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="any" 
                              placeholder="-74.0060" 
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="h-[300px] rounded-md overflow-hidden border">
                    <Map 
                      center={mapCenter} 
                      markers={watchLat && watchLng ? [{
                        id: 'property',
                        lat: watchLat,
                        lng: watchLng,
                        title: form.getValues('title') || 'Property Location',
                      }] : []}
                      height="300px"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="features">
            <AccordionTrigger>Features</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      {propertyFeatures.map((feature) => (
                        <FormField
                          key={feature.id}
                          control={form.control}
                          name="features"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={feature.id}
                                className="flex flex-row items-start space-x-3 space-y-0 mb-4"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], feature.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== feature.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {feature.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="media">
            <AccordionTrigger>Images</AccordionTrigger>
            <AccordionContent>
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Images</FormLabel>
                    <FormDescription>
                      Upload high-quality images of your property (up to 10)
                    </FormDescription>
                    
                    <FormControl>
                      <div className="space-y-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleImageUpload}
                          className="w-full h-32 border-dashed flex flex-col items-center justify-center gap-2"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span>Upload Images</span>
                          <span className="text-xs text-muted-foreground">
                            {field.value?.length || 0}/10 images
                          </span>
                        </Button>
                        
                        {/* Image gallery */}
                        {field.value && field.value.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                            {field.value.map((image, index) => (
                              <Card key={index} className="overflow-hidden">
                                <div className="relative aspect-square">
                                  <img
                                    src={image}
                                    alt={`Property image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      removeImage(index);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
