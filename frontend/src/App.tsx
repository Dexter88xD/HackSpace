import Navbar from "./components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HackathonExplorer from "./pages/HackathonExplorer";
import Register from "./pages/Register";
import { OtpVerification } from "./pages/OtpVerification";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
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
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/login" element={<Login />} />
		  <Route
		  	path="/profile"
			element={
				<ProtectedRoute>
					<Profile/>
				</ProtectedRoute>
			}
		   />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
