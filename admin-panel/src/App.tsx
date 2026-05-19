import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { Dashboard } from "./pages/Dashboard";
import { UploadResource } from "./pages/UploadResource";
import { Resources } from "./pages/Resources";
import { Seniors } from "./pages/Seniors";
import { Events } from "./pages/Events";
import { VerificationRequests } from "./pages/VerificationRequests";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Temporary Auth Bypass for Development */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/verification" element={<VerificationRequests />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/seniors" element={<Seniors />} />
          <Route path="/events" element={<Events />} />
          <Route path="/upload" element={<UploadResource />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
