import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import MerchantDashboard from "./pages/merchant/Dashboard";
import MerchantDashboardNew from "./pages/MerchantDashboard";
import MerchantDashboardSimple from "./pages/MerchantDashboardSimple";
import CashRegister from './pages/merchant/CashRegister';
import CashRegisterSimple from './pages/merchant/CashRegisterSimple';
import MerchantProfile from './pages/merchant/Profile';
import SocialCoverage from './pages/merchant/SocialCoverage';
import SocialProtection from './pages/merchant/SocialProtection';
import Badges from './pages/merchant/Badges';
import AdminDashboard from './pages/admin/AdminDashboard';
import VirtualMarket from './pages/merchant/VirtualMarket';
import OrderHistory from './pages/merchant/OrderHistory';
import Savings from "./pages/merchant/Savings";
import Events from "./pages/merchant/Events";
import Stock from "./pages/merchant/Stock";
import { MerchantWeather } from "./pages/merchant/Weather";
import MarketsPage from "./pages/admin/Markets";
import MapViewPage from "./pages/admin/MapView";
import EnrollmentWizard from "./pages/agent/EnrollmentWizard";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentTasks from "./pages/agent/AgentTasks";
import MerchantsAdmin from "./pages/MerchantsAdmin";
import MerchantJourney from "./pages/merchant/MerchantJourney";
import CooperativeJourney from "./pages/cooperative/CooperativeJourney";
import RenewalsAdmin from "./pages/admin/RenewalsAdmin";
import Learning from "./pages/Learning";
import CourseDetail from "./pages/CourseDetail";
import AuditLogs from "./pages/admin/AuditLogs";
import MyBadges from "./pages/MyBadges";
import Leaderboard from './pages/Leaderboard';
import Challenges from './pages/Challenges';
import AdminUsers from "./pages/admin/Users";
import Notifications from "./pages/Notifications";
import OrderTracking from "./pages/OrderTracking";
import CooperativeDashboard from "./pages/cooperative/Dashboard";
import GroupedOrders from "./pages/cooperative/GroupedOrders";
import MerchantSettings from "./pages/merchant/Settings";
import MorningBriefing from "./pages/merchant/MorningBriefing";
import OpenDayBriefing from "./pages/merchant/OpenDayBriefing";
import CloseDaySummary from "./pages/merchant/CloseDaySummary";
import SessionsHistory from "./pages/merchant/SessionsHistory";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/merchant"} component={MerchantDashboard} />
      <Route path={"/merchant/dashboard"} component={MerchantDashboardSimple} />      <Route path={"/merchant/morning-briefing"} component={OpenDayBriefing} />
      <Route path={"/merchant/evening-summary"} component={CloseDaySummary} />
      <Route path="/merchant/sessions-history" component={SessionsHistory} />
      <Route path="/merchant/cash-register" component={CashRegisterSimple} />
      <Route path="/merchant/profile" component={MerchantProfile} />
      <Route path="/merchant/social-coverage" component={SocialCoverage} />
      <Route path="/merchant/social-protection" component={SocialProtection} />
      <Route path="/merchant/badges" component={Badges} />
      <Route path="/merchant/market" component={VirtualMarket} />
      <Route path="/merchant/orders" component={OrderHistory} />
      <Route path="/merchant/stock" component={Stock} />
      <Route path="/merchant/savings" component={Savings} />
      <Route path="/merchant/events" component={Events} />
      <Route path="/merchant/weather" component={MerchantWeather} />
      <Route path="/merchant/settings" component={MerchantSettings} />
         {/* Merchant Routes */}
      <Route path="/merchant" component={MerchantDashboard} />
      <Route path="/merchant/journey" component={MerchantJourney} />    <Route path={"/agent/dashboard"} component={AgentDashboard} />
      <Route path={"/agent/enrollment"} component={EnrollmentWizard} />
      <Route path={"/agent/tasks"} component={AgentTasks} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path={"/admin"} component={() => <div className="p-8 text-center">Page Admin - En développement</div>} />
      <Route path={"/admin/markets"} component={MarketsPage} />
      <Route path="/admin/map" component={MapViewPage} />
      <Route path="/admin/merchants" component={MerchantsAdmin} />
      <Route path="/admin/renewals" component={RenewalsAdmin} />
      <Route path="/admin/audit-logs" component={AuditLogs} />
      <Route path="/admin/users" component={AdminUsers} />
      
      {/* Cooperative Routes */}
      <Route path={"/cooperative"} component={CooperativeDashboard} />
      <Route path={"/cooperative/dashboard"} component={CooperativeDashboard} />
      <Route path={"/cooperative/grouped-orders"} component={GroupedOrders} />
      <Route path="/cooperative/journey" component={CooperativeJourney} />
      
      {/* Learning Routes */}
      <Route path="/learning" component={Learning} />
      <Route path="/learning/:id" component={CourseDetail} />
      <Route path="/my-badges" component={MyBadges} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/challenges" component={Challenges} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/orders/:id" component={OrderTracking} />
      
      {/* 404 */}
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
