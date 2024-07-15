import React, { useState, useContext } from 'react';
import '../css/SignupPage.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthContext from '../AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const { setAuthInfo } = useContext(AuthContext);

  const { userName, email, phoneNumber, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/users', formData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setAuthInfo(user, token);
      navigate('/');
      toast.success('Registration successful');
    } catch (error) {
      console.error('Registration error:', error.response.data);
      toast.error('Registration failed');
    }
  };

  return (
    <div className="signup-page">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <div>
          <label>Username:</label>
          <input type="text" name="userName" value={userName} onChange={handleChange} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" name="email" value={email} onChange={handleChange} required />
        </div>
        <div>
          <label>Phone Number:</label>
          <input type="tel" name="phoneNumber" value={phoneNumber} onChange={handleChange} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" name="password" value={password} onChange={handleChange} required />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;