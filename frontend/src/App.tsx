import Navbar from "./components/Navbar";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Hackathons from "./pages/Hackathons";

function App() {
    return (
        <BrowserRouter>
            <Navbar />

            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/hackathons" element={<Hackathons />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App;