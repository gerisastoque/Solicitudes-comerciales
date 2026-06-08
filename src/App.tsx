import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NewRequest from "./pages/NewRequest.tsx";
import RequestsBoard from "./pages/RequestsBoard.tsx";
import RequestDetail from "./pages/RequestDetail.tsx";
import RequestSummary from "./pages/RequestSummary.tsx";
import LdpDashboard from "./pages/LdpDashboard.tsx";
import LdpBoard from "./pages/LdpBoard.tsx";
import LdpDetail from "./pages/LdpDetail.tsx";
import LdpSummary from "./pages/LdpSummary.tsx";
import NodoDashboard from "./pages/NodoDashboard.tsx";
import NodoProfessorDetail from "./pages/NodoProfessorDetail.tsx";
import NodoProposals from "./pages/NodoProposals.tsx";
import NodoProposalDetail from "./pages/NodoProposalDetail.tsx";
import ProfesorDashboard from "./pages/ProfesorDashboard.tsx";
import ProfesorBoard from "./pages/ProfesorBoard.tsx";
import ProfesorDetail from "./pages/ProfesorDetail.tsx";
import NotFound from "./pages/NotFound.tsx";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/solicitudes" element={<RequestsBoard />} />
          <Route path="/solicitudes/nueva" element={<NewRequest />} />
          <Route path="/solicitudes/:id" element={<RequestDetail />} />
          <Route path="/solicitudes/:id/resumen" element={<RequestSummary />} />
          <Route path="/ldp" element={<LdpDashboard />} />
          <Route path="/ldp/propuestas" element={<LdpBoard />} />
          <Route path="/ldp/propuestas/:id" element={<LdpDetail />} />
          <Route path="/ldp/propuestas/:id/resumen" element={<LdpSummary />} />
          <Route path="/nodo" element={<NodoDashboard />} />
          <Route path="/nodo/profesores/:slug" element={<NodoProfessorDetail />} />
          <Route path="/nodo/propuestas" element={<NodoProposals />} />
          <Route path="/nodo/propuestas/:id" element={<NodoProposalDetail />} />
          <Route path="/profesor" element={<ProfesorDashboard />} />
          <Route path="/profesor/propuestas" element={<ProfesorBoard />} />
          <Route path="/profesor/propuestas/:id" element={<ProfesorDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
