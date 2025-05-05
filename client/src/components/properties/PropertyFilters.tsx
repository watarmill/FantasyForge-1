import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, X, Home, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Slider
} from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Import debounce utility
import { debounce } from "@/lib/utils";

interface FilterState {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  status?: string;
}

interface PropertyFiltersProps {
  initialFilters?: FilterState;
}

export function PropertyFilters({ initialFilters = {} }: PropertyFiltersProps) {
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Function to build URL query string based on filters
  const buildQueryString = useCallback((filters: FilterState) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 'any') {
        params.append(key, String(value));
      }
    });
    
    return params.toString();
  }, []);

  // Debounced navigation function
  const debouncedNavigate = useCallback(
    debounce((queryString: string) => {
      navigate(`/properties${queryString ? `?${queryString}` : ''}`);
    }, 500),
    [navigate]
  );

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedNavigate(buildQueryString(newFilters));
  };

  // Handle price range change
  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
    const newFilters = {
      ...filters,
      minPrice: values[0],
      maxPrice: values[1]
    };
    setFilters(newFilters);
    debouncedNavigate(buildQueryString(newFilters));
  };

  // Clear all filters
  const clearFilters = () => {
    setPriceRange([0, 2000000]);
    setFilters({});
    navigate('/properties');
    setIsFilterMenuOpen(false);
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);

  // Get number of active filters (excluding search)
  const activeFilterCount = Object.entries(filters)
    .filter(([key, value]) => 
      key !== 'search' && 
      value !== undefined && 
      value !== '' && 
      value !== 'any'
    ).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by location, property name, or keyword..."
            className="pl-9"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          {filters.search && (
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              onClick={() => handleFilterChange('search', '')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Sheet open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[440px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex justify-between items-center">
                <span>Property Filters</span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              <Accordion type="multiple" defaultValue={["price", "features", "details"]}>
                <AccordionItem value="price">
                  <AccordionTrigger>Price Range</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <Slider 
                        defaultValue={[0, 2000000]} 
                        max={2000000} 
                        step={10000}
                        value={priceRange}
                        onValueChange={handlePriceRangeChange}
                      />
                      <div className="flex justify-between text-sm">
                        <span>{formatPrice(priceRange[0])}</span>
                        <span>{formatPrice(priceRange[1])}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="details">
                  <AccordionTrigger>Property Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="propertyType">Property Type</Label>
                        <Select 
                          value={filters.propertyType || 'any'} 
                          onValueChange={(value) => handleFilterChange('propertyType', value)}
                        >
                          <SelectTrigger id="propertyType">
                            <SelectValue placeholder="Any Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Type</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={filters.status || 'any'} 
                          onValueChange={(value) => handleFilterChange('status', value)}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Any Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                            <SelectItem value="rented">Rented</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Select 
                          value={filters.bedrooms || 'any'} 
                          onValueChange={(value) => handleFilterChange('bedrooms', value)}
                        >
                          <SelectTrigger id="bedrooms">
                            <SelectValue placeholder="Any Bedrooms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Bedrooms</SelectItem>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                            <SelectItem value="5">5+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Select 
                          value={filters.bathrooms || 'any'} 
                          onValueChange={(value) => handleFilterChange('bathrooms', value)}
                        >
                          <SelectTrigger id="bathrooms">
                            <SelectValue placeholder="Any Bathrooms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Bathrooms</SelectItem>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="1.5">1.5+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="2.5">2.5+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <Button 
                className="w-full mt-4" 
                onClick={() => setIsFilterMenuOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Active filter tags - optional for desktop view */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.propertyType && filters.propertyType !== 'any' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              {filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1)}
              <button 
                onClick={() => handleFilterChange('propertyType', 'any')}
                className="ml-1 rounded-full hover:bg-secondary/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {/* Similar badges for other active filters */}
        </div>
      )}
    </div>
  );
}

// Shadcn badge import
function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" | "destructive" }) {
  const baseClass = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variantClass = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
  }[variant || "default"];
  
  return (
    <div className={`${baseClass} ${variantClass} ${className}`} {...props} />
  );
}
