import Navbar from "./components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HackathonExplorer from "./pages/HackathonExplorer";
import Register from "./pages/Register";
import { OtpVerification } from "./pages/OtpVerification";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import HackathonManagement from "./pages/HackathonManagement";
import CreateHackathon from "./pages/CreateHackathon";
import EditHackathon from "./pages/EditHackathon";
import HackathonDetails from "./pages/HackathonDetails";
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
            path="/hackathons"
            element={
              <ProtectedRoute>
                <HackathonManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hackathons/new"
            element={
              <ProtectedRoute>
                <CreateHackathon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hackathons/:id"
            element={
              <ProtectedRoute>
                <HackathonDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hackathons/:id/edit"
            element={
              <ProtectedRoute>
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
