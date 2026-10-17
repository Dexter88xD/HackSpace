import Navbar from "./components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HackathonExplorer from "./pages/HackathonExplorer";
import Register from "./pages/Register";
import { OtpVerification } from "./pages/OtpVerification";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import HackathonManagement from "./pages/admin/HackathonManagement";
import CreateHackathon from "./pages/admin/CreateHackathon";
import EditHackathon from "./pages/admin/EditHackathon";
function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hackathon-explorer"
            element={
              <ProtectedRoute>
                <HackathonExplorer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hackathons"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <HackathonManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hackathons/new"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <CreateHackathon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hackathons/:id/edit"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <EditHackathon />
              </ProtectedRoute>
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
