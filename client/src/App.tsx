import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "@/pages/NotFound";

import MerchantDashboard from "./pages/merchant-simple/Dashboard";
import MerchantCashRegister from "./pages/merchant-simple/CashRegister";
import MerchantStock from "./pages/merchant-simple/Stock";
import MerchantSavings from "./pages/merchant-simple/Savings";
import MerchantHistory from "./pages/merchant-simple/History";
import MerchantWallet from "./pages/merchant-simple/Wallet";
import MerchantSendMoney from "./pages/merchant-simple/SendMoney";
import MerchantBeneficiaries from "./pages/merchant-simple/Beneficiaries";

import AgentDashboard from "./pages/agent-simple/Dashboard";

import VoiceStudio from "./pages/admin/VoiceStudio";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      <Route path="/merchant" component={MerchantDashboard} />
      <Route path="/merchant/dashboard" component={MerchantDashboard} />
      <Route path="/merchant/cash-register" component={MerchantCashRegister} />
      <Route path="/merchant/stock" component={MerchantStock} />
      <Route path="/merchant/savings" component={MerchantSavings} />
      <Route path="/merchant/history" component={MerchantHistory} />
      <Route path="/merchant/wallet" component={MerchantWallet} />
      <Route path="/merchant/send-money" component={MerchantSendMoney} />
      <Route path="/merchant/beneficiaries" component={MerchantBeneficiaries} />

      <Route path="/agent" component={AgentDashboard} />
      <Route path="/agent/dashboard" component={AgentDashboard} />

      <Route path="/admin/voice-studio" component={VoiceStudio} />

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
