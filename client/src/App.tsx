import { Toaster } from "@/components/ui/sonner";
import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Eager load: Page d'accueil (chargée immédiatement)
import Home from "./pages/Home";
import NotFound from "@/pages/NotFound";

// Lazy load: Toutes les autres pages (chargées à la demande)
const MerchantDashboard = lazy(() => import("./pages/merchant/Dashboard"));
const MerchantDashboardNew = lazy(() => import("./pages/MerchantDashboard"));
const MerchantDashboardSimple = lazy(() => import("./pages/MerchantDashboardSimple"));
const CashRegister = lazy(() => import('./pages/merchant/CashRegister'));
const CashRegisterSimple = lazy(() => import('./pages/merchant/CashRegisterSimple'));
const MerchantProfile = lazy(() => import('./pages/merchant/Profile'));
const SocialCoverage = lazy(() => import('./pages/merchant/SocialCoverage'));
const SocialProtection = lazy(() => import('./pages/merchant/SocialProtection'));
const Badges = lazy(() => import('./pages/merchant/Badges'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const VirtualMarket = lazy(() => import('./pages/merchant/VirtualMarket'));
const OrderHistory = lazy(() => import('./pages/merchant/OrderHistory'));
const Savings = lazy(() => import("./pages/merchant/Savings"));
const Events = lazy(() => import("./pages/merchant/Events"));
const Stock = lazy(() => import("./pages/merchant/Stock"));
const MerchantWeather = lazy(() => import("./pages/merchant/Weather").then(m => ({ default: m.MerchantWeather })));
const MarketsPage = lazy(() => import("./pages/admin/Markets"));
const MapViewPage = lazy(() => import("./pages/admin/MapView"));
const EnrollmentWizard = lazy(() => import("./pages/agent/EnrollmentWizard"));
const AgentDashboard = lazy(() => import("./pages/agent/AgentDashboard"));
const AgentTasks = lazy(() => import("./pages/agent/AgentTasks"));
const MerchantsAdmin = lazy(() => import("./pages/MerchantsAdmin"));
const MerchantJourney = lazy(() => import("./pages/merchant/MerchantJourney"));
const CooperativeJourney = lazy(() => import("./pages/cooperative/CooperativeJourney"));
const RenewalsAdmin = lazy(() => import("./pages/admin/RenewalsAdmin"));
const Learning = lazy(() => import("./pages/Learning"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const MyBadges = lazy(() => import("./pages/MyBadges"));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Challenges = lazy(() => import('./pages/Challenges'));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const Notifications = lazy(() => import("./pages/Notifications"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const CooperativeDashboard = lazy(() => import("./pages/cooperative/Dashboard"));
const GroupedOrders = lazy(() => import("./pages/cooperative/GroupedOrders"));
const MerchantSettings = lazy(() => import("./pages/merchant/Settings"));
const MorningBriefing = lazy(() => import("./pages/merchant/MorningBriefing"));
const OpenDayBriefing = lazy(() => import("./pages/merchant/OpenDayBriefing"));
const CloseDaySummary = lazy(() => import("./pages/merchant/CloseDaySummary"));
const SessionsHistory = lazy(() => import("./pages/merchant/SessionsHistory"));
const AttendanceBadgesPage = lazy(() => import("./pages/merchant/AttendanceBadgesPage"));
const Tutorials = lazy(() => import("./pages/merchant/Tutorials"));
const VoiceRecordingsAdmin = lazy(() => import("./pages/admin/VoiceRecordings"));
const LafricamobileTest = lazy(() => import("./pages/admin/LafricamobileTest"));
const VoiceInterfaceDemo = lazy(() => import("./pages/VoiceInterfaceDemo"));

// Composant de fallback pour le chargement
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/merchant"} component={MerchantDashboard} />
      <Route path={"/merchant/dashboard"} component={MerchantDashboardSimple} />      <Route path={"/merchant/morning-briefing"} component={OpenDayBriefing} />
      <Route path={"/merchant/evening-summary"} component={CloseDaySummary} />
      <Route path="/merchant/sessions-history" component={SessionsHistory} />
      <Route path="/merchant/attendance-badges" component={AttendanceBadgesPage} />
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
      <Route path="/merchant/tutorials" component={Tutorials} />
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
      <Route path="/admin/voice-recordings" component={VoiceRecordingsAdmin} />
      <Route path="/admin/lafricamobile-test" component={LafricamobileTest} />
      <Route path="/voice-demo" component={VoiceInterfaceDemo} />
      
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
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
