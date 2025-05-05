import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { AgentCard } from "@/components/agents/AgentCard";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Loader2, X } from "lucide-react";

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch all agents
  const { data: agents, isLoading, isError } = useQuery<User[]>({
    queryKey: ["/api/users?role=agent"],
  });
  
  // Fetch agent property counts
  const { data: propertyCounts } = useQuery<{ [key: number]: number }>({
    queryKey: ["/api/users/property-counts"],
    enabled: !!agents && agents.length > 0,
  });
  
  // Filter agents based on search term
  const filteredAgents = agents?.filter(agent => {
    return (
      agent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.bio && agent.bio.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }) || [];
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Our Agents</h1>
          <p className="text-muted-foreground">
            Connect with our professional real estate agents
          </p>
        </div>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search agents by name or specialty..." 
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
            <p className="text-destructive font-medium mb-2">Failed to load agents</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            {searchTerm ? (
              <p className="text-muted-foreground mb-4">No agents match your search criteria</p>
            ) : (
              <p className="text-muted-foreground mb-4">No agents are available at the moment</p>
            )}
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                propertyCount={propertyCounts?.[agent.id] || 0}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
