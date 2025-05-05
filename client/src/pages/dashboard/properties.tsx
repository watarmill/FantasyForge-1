import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Property } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  Search, 
  Plus, 
  MoreVertical, 
  Eye, 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  X,
  ListFilter,
  Check
} from "lucide-react";

export default function DashboardPropertiesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Fetch user's properties
  const { data: properties, isLoading: isPropertiesLoading, isError } = useQuery<Property[]>({
    queryKey: ["/api/properties", { ownerId: user?.id }],
    enabled: !!user,
  });
  
  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      await apiRequest("DELETE", `/api/properties/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Property deleted",
        description: "The property has been successfully deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter properties based on search term and status filter
  const filteredProperties = properties?.filter(property => {
    const matchesSearch = 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];
  
  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  // Format currency
  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price));
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Handle status badge color
  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
    
    switch (status) {
      case "active":
        return `${baseClass} bg-emerald-100 text-emerald-800`;
      case "pending":
        return `${baseClass} bg-amber-100 text-amber-800`;
      case "sold":
        return `${baseClass} bg-red-100 text-red-800`;
      case "rented":
        return `${baseClass} bg-blue-100 text-blue-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };
  
  // Change page
  const changePage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // If user is not an agent, redirect them to the dashboard
  if (user && user.role !== "agent" && user.role !== "admin") {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Building className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Agent Account Required</h1>
          <p className="text-muted-foreground mb-6">
            You need an agent account to list and manage properties.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Properties</h1>
            <p className="text-muted-foreground">
              Manage your property listings
            </p>
          </div>
          <Link href="/properties/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Property
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Property Listings</CardTitle>
            <CardDescription>
              {filteredProperties.length} total properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search by title, address..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <ListFilter className="text-muted-foreground h-4 w-4" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isPropertiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <X className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-destructive font-medium mb-2">Failed to load properties</p>
                <Button 
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/properties"] })}
                >
                  Try Again
                </Button>
              </div>
            ) : paginatedProperties.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                {searchTerm || statusFilter !== "all" ? (
                  <>
                    <p className="text-muted-foreground mb-4">No properties match your search criteria</p>
                    <Button variant="outline" onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}>
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">You haven't listed any properties yet</p>
                    <Link href="/properties/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Property
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead className="hidden md:table-cell">Address</TableHead>
                        <TableHead className="hidden md:table-cell">Price</TableHead>
                        <TableHead className="hidden lg:table-cell">Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Created</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProperties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell>
                            <div className="font-medium line-clamp-1">{property.title}</div>
                            <div className="text-sm text-muted-foreground md:hidden">
                              {formatPrice(property.price)}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="line-clamp-1">
                              {property.address}, {property.city}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatPrice(property.price)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell capitalize">
                            {property.propertyType}
                          </TableCell>
                          <TableCell>
                            <div className={getStatusBadge(property.status)}>
                              <Check className="h-3 w-3 mr-1" />
                              <span className="capitalize">{property.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {formatDate(property.createdAt)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => navigate(`/properties/${property.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/properties/${property.id}/edit`)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Property</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete <strong>{property.title}</strong>? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deletePropertyMutation.mutate(property.id)}
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
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changePage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center text-sm">
                        Page {currentPage} of {totalPages}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
