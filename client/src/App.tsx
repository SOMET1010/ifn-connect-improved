import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import MerchantDashboard from "./pages/merchant/Dashboard";
import MerchantDashboardNew from "./pages/MerchantDashboard";
import CashRegister from "./pages/merchant/CashRegister";
import Stock from "./pages/merchant/Stock";
import MarketsPage from "./pages/admin/Markets";
import MapViewPage from "./pages/admin/MapView";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/merchant"} component={MerchantDashboard} />
      <Route path={"/merchant/dashboard"} component={MerchantDashboardNew} />
      <Route path={"/merchant/cash-register"} component={CashRegister} />
      <Route path={"/merchant/stock"} component={Stock} />
      <Route path={"/agent"} component={() => <div className="p-8 text-center">Page Agent - En développement</div>} />
      <Route path={"/cooperative"} component={() => <div className="p-8 text-center">Page Coopérative - En développement</div>} />
      <Route path={"/admin"} component={() => <div className="p-8 text-center">Page Admin - En développement</div>} />
      <Route path={"/admin/markets"} component={MarketsPage} />
      <Route path={"/admin/map"} component={MapViewPage} />
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
