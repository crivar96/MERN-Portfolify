import React, { useState, useEffect, useContext } from 'react';
import '../css/Dashboard.css';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PortfolioList from './PortfolioList';
import Spinner from './Spinner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthContext from '../AuthContext';

const PublicDashboard = ({ authState, setAuthInfo }) => {
  const { userName } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowingPopup, setShowFollowingPopup] = useState(false);
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [showMessageButton, setShowMessageButton] = useState(false);




  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userResponse, likedPortfoliosResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/users/${userName}/public`),
          axios.get('http://localhost:5000/api/users/liked-portfolios', {
            headers: {
              'x-auth-token': authState.token,
            },
          }),
        ]);
  
        const likedPortfoliosIds = likedPortfoliosResponse.data.map((p) => p._id);
        const updatedPortfolios = userResponse.data.portfolios.map((portfolio) => ({
          ...portfolio,
          isLiked: likedPortfoliosIds.includes(portfolio._id),
        }));
  
        setUser(userResponse.data);
        setPortfolios(updatedPortfolios);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, [userName, authState.token]);

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        if (authState.isAuthenticated && user) {
          const response = await axios.get(`http://localhost:5000/api/users/checkfollow/${user._id}`, {
            headers: {
              'x-auth-token': authState.token,
            },
          });
          setIsFollowing(response.data.isFollowing);
          setShowMessageButton(response.data.isFollowing);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    if (authState.isAuthenticated && user) {
      checkFollowStatus();
    }
  }, [authState.isAuthenticated, authState.token, user, authState.user]);

  const handleMessageClick = async () => {
    try {
      await axios.post(
        `http://localhost:5000/api/users/messages/${user._id}`,
        { content: '' },
        {
          headers: {
            'x-auth-token': authState.token,
          },
        }
      );
      // Optionally, you can show a success message or redirect to the messages popup
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const handleFollow = async () => {
    try {
      await axios.post(`http://localhost:5000/api/users/follow/${user._id}`, null, {
        headers: {
          'x-auth-token': authState.token,
        },
      });
      setIsFollowing(true);
      toast.success('User followed successfully');
      fetchUpdatedUserData();
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.post(`http://localhost:5000/api/users/follow/${user._id}`, null, {
        headers: {
          'x-auth-token': authState.token,
        },
      });
      setIsFollowing(false);
      toast.success('User unfollowed successfully');
      fetchUpdatedUserData();
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    }
  };

  const handleSearchUserChange = (event) => {
    setSearchUser(event.target.value);
  };

  const handleSearchUserSubmit = (event) => {
    event.preventDefault();
    navigate(`/dashboard/${searchUser}/public`);
  };

  const fetchUpdatedUserData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${userName}/public`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching updated user data:', error);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <div>User not found.</div>;
  }

  const handleBackToDashboard = () => {
    navigate(`/dashboard/${authState.user.userName}`);
  };

  const toggleFollowingPopup = () => {
    setShowFollowingPopup(!showFollowingPopup);
  };

  const toggleFollowersPopup = () => {
    setShowFollowersPopup(!showFollowersPopup);
  };

  const handleUserClick = (clickedUser) => {
    if (authState.isAuthenticated && clickedUser._id === authState.user._id) {
      navigate(`/dashboard/${authState.user.userName}`); // Navigate to the logged-in user's private dashboard
    } else {
      navigate(`/dashboard/${clickedUser.userName}/public`); // Navigate to the public dashboard
    }
  };

  const handleLikePortfolio = async (portfolioId) => {
    try {
      await axios.post(`http://localhost:5000/api/portfolios/${portfolioId}/like`, null, {
        headers: {
          'x-auth-token': authState.token,
        },
      });
      const updatedPortfolios = portfolios.map((portfolio) =>
        portfolio._id === portfolioId
          ? { ...portfolio, likes: portfolio.likes + 1, isLiked: true }
          : portfolio
      );
      setPortfolios(updatedPortfolios);
    } catch (error) {
      console.error('Error liking portfolio:', error);
    }
  };
  
  const handleUnlikePortfolio = async (portfolioId) => {
    try {
      await axios.post(`http://localhost:5000/api/portfolios/${portfolioId}/unlike`, null, {
        headers: {
          'x-auth-token': authState.token,
        },
      });
      const updatedPortfolios = portfolios.map((portfolio) =>
        portfolio._id === portfolioId
          ? { ...portfolio, likes: portfolio.likes - 1, isLiked: false }
          : portfolio
      );
      setPortfolios(updatedPortfolios);
    } catch (error) {
      console.error('Error unliking portfolio:', error);
    }
  };

  return (
    <div className="dashboard-body">
      <header className="dashboardNavBar">
        <form onSubmit={handleSearchUserSubmit}>
          <input
            type="text"
            value={searchUser}
            onChange={handleSearchUserChange}
            placeholder="Search for a user..."
          />
          <button type="submit">Search</button>
        </form>
        {authState.isAuthenticated && (
          <button className="back-to-dashboard-btn" onClick={handleBackToDashboard}>
            Back to My Dashboard
          </button>
        )}

      </header>
      <div className="main-content">
        <div className="dashboard-header">
          {user.profilePicture && user.profilePicture.data ? (
            <img
              src={`data:${user.profilePicture.contentType};base64,${user.profilePicture.data}`}
              alt="Profile"
            />
          ) : (
            <div className="empty-profile-picture">No profile picture</div>
          )}
          <h1>Welcome to {user.userName}'s Dashboard!</h1>


          <div className="follow-info">
            {authState.isAuthenticated && (
              <>
                {isFollowing ? (
                  <button onClick={handleUnfollow}>Unfollow</button>
                ) : (
                  <button onClick={handleFollow}>Follow</button>
                )}
              </>
            )}
            <div className="following-info">
              <button onClick={toggleFollowingPopup}>Following: {user.following.length}</button>
              {showFollowingPopup && (
                <div className="overlay">
                  <div className="follow-popup" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <h2>Following</h2>
                    <ul>
                      {user.following.map((followedUser) => (
                        <li key={followedUser._id} onClick={() => handleUserClick(followedUser)}>
                          {followedUser.userName}
                        </li>
                      ))}
                    </ul>
                    <button className="close-button" onClick={toggleFollowingPopup}>Close</button>
                  </div>
                </div>
              )}
            </div>
            <div className="followers-info">
              <button onClick={toggleFollowersPopup}>Followers: {user.followers.length}</button>
              {showFollowersPopup && (
                <div className="overlay">
                  <div className="follow-popup" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <h2>Followers</h2>
                    <ul>
                      {user.followers.map((follower) => (
                        <li key={follower._id} onClick={() => handleUserClick(follower)}>
                          {follower.userName}
                        </li>
                      ))}
                    </ul>
                    <button className="close-button" onClick={toggleFollowersPopup}>Close</button>
                  </div>
                </div>
              )}
            </div>
            
            {showMessageButton && (
              <button onClick={handleMessageClick}>Message</button>
            )}
          </div>
          <p>{user.info || 'No bio available.'}</p>
        </div>

        <section2>
          <h2 className="urPorts">Portfolios</h2>
          <PortfolioList
            portfolios={portfolios}
            isPublicDashboard={true}
            onLikePortfolio={handleLikePortfolio}
            onUnlikePortfolio={handleUnlikePortfolio}
            showAddPortfolioForm={false}
          />

        </section2>
      </div>
    </div>
  );
};

export default PublicDashboard;