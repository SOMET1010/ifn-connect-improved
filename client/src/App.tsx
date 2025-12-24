import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import MerchantDashboard from "./pages/merchant/Dashboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/merchant"} component={MerchantDashboard} />
      <Route path={"/agent"} component={() => <div className="p-8 text-center">Page Agent - En développement</div>} />
      <Route path={"/cooperative"} component={() => <div className="p-8 text-center">Page Coopérative - En développement</div>} />
      <Route path={"/admin"} component={() => <div className="p-8 text-center">Page Admin - En développement</div>} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
