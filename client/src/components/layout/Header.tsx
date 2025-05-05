import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, User, Home, Building, Heart, MessageSquare, LayoutDashboard, LogOut, Users, Shield } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  const NavItems = () => (
    <>
      <Link href="/">
        <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-foreground/80"}`}>
          Home
        </a>
      </Link>
      <Link href="/properties">
        <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/properties" ? "text-primary" : "text-foreground/80"}`}>
          Properties
        </a>
      </Link>
      <Link href="/agents">
        <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/agents" ? "text-primary" : "text-foreground/80"}`}>
          Agents
        </a>
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/">
            <a className="flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl hidden md:inline-block">EstateHub</span>
            </a>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <NavItems />
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {user && user.role === "agent" && (
            <Link href="/properties/create">
              <Button variant="secondary" size="sm" className="hidden md:flex">
                List Property
              </Button>
            </Link>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.profileImage || ""} alt={user.fullName} />
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                </Link>
                {user.role === 'agent' && (
                  <Link href="/dashboard/properties">
                    <DropdownMenuItem className="cursor-pointer">
                      <Building className="mr-2 h-4 w-4" />
                      <span>My Properties</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <Link href="/dashboard/favorites">
                  <DropdownMenuItem className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Favorites</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/messages">
                  <DropdownMenuItem className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </DropdownMenuItem>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>EstateHub</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <NavItems />
                {user && user.role === "agent" && (
                  <Link href="/properties/create">
                    <a className="text-sm font-medium transition-colors hover:text-primary">
                      List Property
                    </a>
                  </Link>
                )}
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <a className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </a>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-medium text-left text-destructive flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </>
                ) : (
                  <Link href="/auth">
                    <a className="text-sm font-medium text-primary flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Sign In
                    </a>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
