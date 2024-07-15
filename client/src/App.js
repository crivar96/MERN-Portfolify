import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import axios from 'axios';
import './css/App.css';
import LoginPage from './pages/Login';
import SignupPage from './pages/Register';
import Modal from 'react-modal';
import Dashboard from './pages/Dashboard';
import PublicDashboard from './pages/PublicDashboard';
import AuthContext from './AuthContext';
import PortfolioDetails from './pages/PortfolioDetails';

Modal.setAppElement('#root'); // This line is important for accessibility purposes


const HomePage = ({ openModalWithContent }) => {
  
  const [filterOpen, setFilterOpen] = useState(false);

  

  const handleFilterClick = () => {
    setFilterOpen(!filterOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterOpen && filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterOpen]);

  const filterRef = useRef(null);

  return (
    <div>
      <header>
        <nav className='homepage-nav'>
          <img src='portfolifyLogo.PNG' alt='PortfolifyLogo' className='logo' />
          <ul className="nav-links">
            <li><ScrollLink to="hero-section" smooth={true} duration={500}>Home</ScrollLink></li>
            <li><ScrollLink to="about" smooth={true} duration={500}>About</ScrollLink></li>
            <li><ScrollLink to="contact" smooth={true} duration={500}>Contact</ScrollLink></li>
          </ul>
          <div className="auth-buttons">
            <button onClick={() => openModalWithContent(<LoginPage />)} className="auth-buttons login-btn">Log In</button>
            <button onClick={() => openModalWithContent(<SignupPage />)} className="auth-buttons signup-btn">Sign Up</button>
          </div>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Portfolify</h1>
          <p className='hero-p'>Create and showcase your professional portfolio with ease.</p>
          <button onClick={() => openModalWithContent(<SignupPage />)} className="get-started-btn">Get Started</button>
        </div>
      </section>

      <section id="about" className='about-section'>
        <div className='about-content'>
          <h2>About Us</h2>
          <p>
            Welcome to Portfolify! Where creativity meets opportunity. Our platform is designed
            to empower individuals from various fields to showcase their talents and accomplishments.
          </p>
          <p>
            At Portfolify, we believe in the power of effective storytelling through portfolios.
            Whether you are a designer, developer, marketer, or any professional, our platform
            provides a space for you to shine.
          </p>
          <p>
            Our dedicated team is passionate about connecting talent with opportunities. Explore
            the possibilities with Portfolify and start building your professional story today.
          </p>
        </div>
        <img src='aboutUsIMG.PNG' alt='abt us img' className='aboutUs-img' />
      </section>
      <section id='contact' className="contact-section">
        <div className="contact-content">
          <h2>Contact Us</h2>
          <p>Have questions or feedback? Reach out to us!</p>
          <p> Email: crivar96@students.edu | darjis76@students.rowan.edu | reyesf52@students.rowan.edu | shield74@students.rowan.edu</p>
        </div>
      </section>

    </div>
  );
};

const App = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData(token);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      // Make an API call to fetch user data using the token
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: {
          'x-auth-token': token,
        },
      });
      const userData = response.data.user;
      setAuthInfo({ ...userData, userName: userData.userName }, token);
    } catch (error) {
      console.error('Error fetching user data:', error);
      clearAuthInfo();
    }
  };

  useEffect(() => {
    document.body.className = '';
  }, []);

  const openModalWithContent = (content) => {
    setModalContent(content);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const setAuthInfo = (user, token) => {
    setAuthState({ isAuthenticated: true, user, token });
  };

  const clearAuthInfo = () => {
    setAuthState({ isAuthenticated: false, user: null, token: null });
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthInfo, clearAuthInfo }}>
      <Router>
        <div className="App">
        <Routes>
            <Route
              path="/dashboard/:userName"
              element={
                authState.isAuthenticated ? (
                  <Dashboard authState={authState} setAuthInfo={setAuthInfo} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/dashboard/:userName/public"
              element={<PublicDashboard authState={authState} setAuthInfo={setAuthInfo} />}
            />
            <Route path="/" element={<HomePage openModalWithContent={openModalWithContent} />} />
            <Route path="/portfolio-details/:portfolioId" element={<PortfolioDetails />} />
          </Routes>

          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            contentLabel="Auth Modal"
            className="modal-content"
            overlayClassName="modal-overlay"
          >
            {modalContent}
          </Modal>
        </div>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;