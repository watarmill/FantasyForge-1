import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Pages
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import PropertiesPage from "@/pages/properties/index";
import PropertyDetailPage from "@/pages/properties/detail";
import CreatePropertyPage from "@/pages/properties/create";
import EditPropertyPage from "@/pages/properties/edit";
import DashboardPage from "@/pages/dashboard/index";
import DashboardPropertiesPage from "@/pages/dashboard/properties";
import DashboardFavoritesPage from "@/pages/dashboard/favorites";
import DashboardMessagesPage from "@/pages/dashboard/messages";
import AgentsPage from "@/pages/agents/index";
import AdminPage from "@/pages/admin/index";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      <Route path="/agents" component={AgentsPage} />
      
      {/* Protected routes */}
      <ProtectedRoute 
        path="/properties/create" 
        component={CreatePropertyPage}
        requiredRole="agent" 
      />
      <ProtectedRoute 
        path="/properties/:id/edit" 
        component={EditPropertyPage} 
        requiredRole="agent"
      />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/dashboard/properties" component={DashboardPropertiesPage} />
      <ProtectedRoute path="/dashboard/favorites" component={DashboardFavoritesPage} />
      <ProtectedRoute path="/dashboard/messages" component={DashboardMessagesPage} />
      <ProtectedRoute path="/admin" component={AdminPage} requiredRole="admin" />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
