import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@shared/schema";
import { MessageSquare, Building } from "lucide-react";

interface AgentCardProps {
  agent: User;
  propertyCount?: number;
}

export function AgentCard({ agent, propertyCount = 0 }: AgentCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="p-4 pb-2 flex flex-col items-center text-center border-b">
        <Avatar className="h-24 w-24 mb-2">
          <AvatarImage src={agent.profileImage || ""} alt={agent.fullName} />
          <AvatarFallback className="text-lg">{getInitials(agent.fullName)}</AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-medium">{agent.fullName}</h3>
        <p className="text-sm text-muted-foreground">Real Estate Agent</p>
      </CardHeader>
      
      <CardContent className="p-4 flex-1">
        {agent.bio ? (
          <p className="text-sm text-muted-foreground line-clamp-3">{agent.bio}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No bio available</p>
        )}
        
        <div className="mt-4 flex items-center gap-1 text-sm">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span>{propertyCount} {propertyCount === 1 ? 'Listing' : 'Listings'}</span>
        </div>
        
        {agent.phone && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Phone: </span>
            <a href={`tel:${agent.phone}`} className="text-primary hover:underline">
              {agent.phone}
            </a>
          </div>
        )}
        
        <div className="mt-2 text-sm">
          <span className="text-muted-foreground">Email: </span>
          <a href={`mailto:${agent.email}`} className="text-primary hover:underline">
            {agent.email}
          </a>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Link href={`/agents/${agent.id}`} className="flex-1">
          <Button variant="outline" className="w-full">View Profile</Button>
        </Link>
        <Link href={`/dashboard/messages?receiver=${agent.id}`} className="flex-1">
          <Button className="w-full flex items-center justify-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>Contact</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
