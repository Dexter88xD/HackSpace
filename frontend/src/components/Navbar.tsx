import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="flex items-center justify-between px-8 py-4">
            <h2>HackSpace</h2>
            <Link to="/">Home</Link>
            <Link to="/hackathon-explorer">Hackathons</Link>
        </nav>
    );
}

export default Navbar;