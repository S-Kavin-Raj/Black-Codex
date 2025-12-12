import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Topology from "./pages/Topology";
import Inventory from "./pages/Inventory";
import IntruderFeed from "./pages/IntruderFeed";
import ScanEngine from "./pages/ScanEngine";
import AIReport from "./pages/AIReport";
import Quarantine from "./pages/Quarantine";
import AdminCenter from "./pages/AdminCenter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/topology" element={<Topology />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/intruder-feed" element={<IntruderFeed />} />
          <Route path="/scan-engine" element={<ScanEngine />} />
          <Route path="/ai-report" element={<AIReport />} />
          <Route path="/quarantine" element={<Quarantine />} />
          <Route path="/admin-center" element={<AdminCenter />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
