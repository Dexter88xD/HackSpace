import Navbar from "./components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Hackathons from "./pages/Hackathons";
import Register from "./pages/Register";
import { OtpVerification } from "./pages/OtpVerification";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import HackathonManagement from "./pages/admin/HackathonManagement";
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
            path="/hackathons"
            element={
              <ProtectedRoute>
                <Hackathons />
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
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
