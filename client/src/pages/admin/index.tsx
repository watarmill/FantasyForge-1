import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Property, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Building,
  MessageSquare,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Loader2,
  Filter,
  AlertCircle,
} from "lucide-react";

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [propertiesSearchTerm, setPropertiesSearchTerm] = useState("");
  const [usersSearchTerm, setUsersSearchTerm] = useState("");
  
  // Check if user is admin, if not redirect to home
  if (user && user.role !== "admin") {
    navigate("/");
  }
  
  // Fetch all properties including unapproved ones
  const { data: allProperties, isLoading: isPropertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/admin/properties"],
    enabled: !!user && user.role === "admin",
  });
  
  // Fetch all users
  const { data: allUsers, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === "admin",
  });
  
  // Filter properties based on search term
  const filteredProperties = allProperties?.filter(property => {
    return (
      property.title.toLowerCase().includes(propertiesSearchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(propertiesSearchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(propertiesSearchTerm.toLowerCase())
    );
  }) || [];
  
  // Filter users based on search term
  const filteredUsers = allUsers?.filter(user => {
    return (
      user.fullName.toLowerCase().includes(usersSearchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(usersSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(usersSearchTerm.toLowerCase())
    );
  }) || [];
  
  // Approve property mutation
  const approvePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      await apiRequest("PATCH", `/api/admin/properties/${propertyId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      toast({
        title: "Property approved",
        description: "The property has been successfully approved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      await apiRequest("DELETE", `/api/properties/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get badge styles based on property status
  const getStatusBadge = (status: string, approved: boolean) => {
    const baseClass = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium gap-1";
    
    if (!approved) {
      return `${baseClass} bg-amber-100 text-amber-800`;
    }
    
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
  
  // Get badge for user role
  const getRoleBadge = (role: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
    
    switch (role) {
      case "admin":
        return `${baseClass} bg-red-100 text-red-800`;
      case "agent":
        return `${baseClass} bg-blue-100 text-blue-800`;
      case "user":
        return `${baseClass} bg-gray-100 text-gray-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage properties, users, and site settings
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span>Properties</span>
                </div>
                <span className="text-primary">{allProperties?.length || 0}</span>
              </CardTitle>
              <CardDescription>
                Total properties including pending approvals
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Users</span>
                </div>
                <span className="text-primary">{allUsers?.length || 0}</span>
              </CardTitle>
              <CardDescription>
                Total registered users across all roles
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span>Pending Approvals</span>
                </div>
                <span className="text-amber-500">
                  {allProperties?.filter(p => !p.approved).length || 0}
                </span>
              </CardTitle>
              <CardDescription>
                Properties waiting for approval
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        
        <Tabs defaultValue="properties">
          <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Properties</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search properties..." 
                  className="pl-9"
                  value={propertiesSearchTerm}
                  onChange={(e) => setPropertiesSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Filter:</span>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setPropertiesSearchTerm("")}
                >
                  All
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-amber-50 transition-colors bg-amber-50/50 text-amber-700"
                  onClick={() => setPropertiesSearchTerm("pending")}
                >
                  Pending Approval
                </Badge>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {isPropertiesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No properties found</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead className="hidden md:table-cell">Owner</TableHead>
                          <TableHead className="hidden lg:table-cell">Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Created</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProperties.map(property => (
                          <TableRow key={property.id}>
                            <TableCell>
                              <div className="font-medium line-clamp-1">{property.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">{property.address}, {property.city}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="line-clamp-1">
                                Agent #{property.ownerId}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {formatPrice(property.price)}
                            </TableCell>
                            <TableCell>
                              <div className={getStatusBadge(property.status, property.approved)}>
                                {!property.approved ? (
                                  <>
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Pending Approval</span>
                                  </>
                                ) : (
                                  <span className="capitalize">{property.status}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
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
                                    View Property
                                  </DropdownMenuItem>
                                  {!property.approved && (
                                    <DropdownMenuItem 
                                      onClick={() => approvePropertyMutation.mutate(property.id)}
                                      className="text-emerald-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
                                        deletePropertyMutation.mutate(property.id);
                                      }
                                    }}
                                    className="text-destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-9"
                  value={usersSearchTerm}
                  onChange={(e) => setUsersSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Filter:</span>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setUsersSearchTerm("")}
                >
                  All
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-blue-50 transition-colors bg-blue-50/50 text-blue-700"
                  onClick={() => setUsersSearchTerm("agent")}
                >
                  Agents
                </Badge>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {isUsersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="hidden lg:table-cell">Phone</TableHead>
                          <TableHead className="hidden md:table-cell">Joined</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map(user => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-sm text-muted-foreground">@{user.username}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              <div className={getRoleBadge(user.role)}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {user.phone || "—"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {formatDate(user.createdAt)}
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
                                  {user.role === "agent" && (
                                    <DropdownMenuItem onClick={() => navigate(`/agents/${user.id}`)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Profile
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => navigate(`/dashboard/messages?receiver=${user.id}`)}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Send Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
