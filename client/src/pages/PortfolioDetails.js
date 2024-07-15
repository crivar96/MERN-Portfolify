import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../AuthContext';
import '../buffer';
import '../css/PortfolioDetails.css';
import { toast } from 'react-toastify';

const PortfolioDetails = () => {
  const { authState } = useContext(AuthContext);
  const { portfolioId } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPortfolioDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/portfolios/${portfolioId}?populate=images`);
        setPortfolio(response.data);
        if (authState.user) {
          setIsOwner(response.data.userId._id === authState.user._id);
        }
      } catch (error) {
        console.error('Error fetching portfolio details:', error);
        if (error.response && error.response.status === 404) {
          setPortfolio(null);
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchPortfolioDetails();
  }, [portfolioId, authState.user]);

  

  useEffect(() => {
    const checkLikedStatus = async () => {
      try {
        if (authState.isAuthenticated && portfolio) {
          const response = await axios.get(`http://localhost:5000/api/users/liked-portfolios`, {
            headers: {
              'x-auth-token': authState.token,
            },
          });
          const likedPortfolios = response.data;
          setIsLiked(likedPortfolios.some((p) => p._id === portfolio._id));
        }
      } catch (error) {
        console.error('Error checking liked status:', error);
      }
    };

    checkLikedStatus();
  }, [authState.isAuthenticated, authState.token, portfolio]);

  useEffect(() => {
    if (portfolio) {
      setLikeCount(portfolio.likes);
    }
  }, [portfolio]);

  const handleImageUpload = async (event) => {
    if (!isOwner) return;

    const file = event.target.files[0];
    const description = prompt('Enter a description for the image:');
    if (file && description) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('description', description);
        formData.append('portfolioId', portfolioId);

        const response = await axios.post('http://localhost:5000/api/images', formData, {
          headers: {
            'x-auth-token': authState.token,
            'Content-Type': 'multipart/form-data',
          },
        });

        setPortfolio((prevPortfolio) => ({
          ...response.data,
          userId: prevPortfolio.userId, // Preserve the existing userId
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!isOwner) return;
  
    try {
      await axios.delete(`http://localhost:5000/api/images/${imageId}`, {
        headers: {
          'x-auth-token': authState.token,
        },
      });
      setPortfolio((prevPortfolio) => ({
        ...prevPortfolio,
        images: prevPortfolio.images.filter((image) => image._id !== imageId),
      }));
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio not found.</div>;
  }

  const handleBackToDashboard = () => {
    if (authState.isAuthenticated && authState.user && portfolio.userId._id === authState.user._id) {
      navigate(`/dashboard/${authState.user.userName}`); // Navigate to the logged-in user's private dashboard
    } else {
      navigate(`/dashboard/${portfolio.userId.userName}/public`); // Navigate to the public dashboard
    }
  };

  

  const handleLike = async () => {
    try {
      await axios.post(`http://localhost:5000/api/portfolios/${portfolio._id}/like`, null, {
        headers: {
          'x-auth-token': authState.token,
        },
      });
      setIsLiked(true);
      setLikeCount((prevCount) => prevCount + 1);
    } catch (error) {
      console.error('Error liking portfolio:', error);
    }
  };

  const handleUnlike = async () => {
    try {
      await axios.post(`http://localhost:5000/api/portfolios/${portfolio._id}/unlike`, null, {
        headers: {
          'x-auth-token': authState.token,
        },
      });
      setIsLiked(false);
      setLikeCount((prevCount) => prevCount - 1);
    } catch (error) {
      console.error('Error unliking portfolio:', error);
    }
  };

  return (
    <div className="portfolio-details-container">
      <button className="back-button" onClick={handleBackToDashboard}>
        Back to Dashboard
      </button>
      <header>
        <h2>{portfolio.portfolioName}</h2>
        <p>{portfolio.description}</p>
        {authState.isAuthenticated && (
      <div className="like-button">
        {isLiked ? (
          <button onClick={handleUnlike}>Unlike</button>
        ) : (
          <button onClick={handleLike}>Like</button>
        )}
        <span>{likeCount} likes</span>
      </div>
    )}
      </header>
      <div className="image-gallery">
        {portfolio.images.map((image) => (
          <div key={image._id} className="image-container">
            <img
              src={`data:${image.file.contentType};base64,${Buffer.from(image.file.data.data).toString('base64')}`}
              alt={image.imageName}
            />
            <div className="image-info">
              <p>{image.description}</p>
              {isOwner && (
                <button className="delete-image-btn" onClick={() => handleDeleteImage(image._id)}>
                  Delete Image
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {isOwner && (
        <div className="image-upload">
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <label htmlFor="image-upload" className="upload-label">
            Add Image
          </label>
        </div>
      )}
    </div>
  );
};

export default PortfolioDetails;