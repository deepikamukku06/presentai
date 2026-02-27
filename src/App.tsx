import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import ScriptInput from "./pages/ScriptInput";
import LivePresentation from "./pages/LivePresentation";
import Report from "./pages/Report";
import Learning from "./pages/Learning";
import UploadAnalysis from "./pages/UploadAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/script" element={<ScriptInput />} />
          <Route path="/presentation" element={<LivePresentation />} />
          <Route path="/report" element={<Report />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/upload" element={<UploadAnalysis />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
