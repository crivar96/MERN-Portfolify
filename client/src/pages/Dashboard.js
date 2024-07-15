import React, { useState, useEffect, useContext, useRef } from 'react';
import '../css/Dashboard.css';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import PortfolioList from './PortfolioList';
import AddPortfolioForm from './AddPortfolioForm';
import Spinner from './Spinner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthContext from '../AuthContext';

const Dashboard = ({ authState }) => {
  const navigate = useNavigate();
  const { userName } = useParams();
  const [user, setUser] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const { clearAuthInfo } = useContext(AuthContext);
  const [showFollowingPopup, setShowFollowingPopup] = useState(false);
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessagesPopup, setShowMessagesPopup] = useState(false);
  const [likedPortfolios, setLikedPortfolios] = useState([]);
  const [showLikedPortfolios, setShowLikedPortfolios] = useState(false);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (authState.isAuthenticated) {
          const [userResponse, portfoliosResponse, likedPortfoliosResponse] = await Promise.all([
            axios.get('http://localhost:5000/api/users', {
              headers: {
                'x-auth-token': authState.token,
              },
            }),
            axios.get('http://localhost:5000/api/portfolios', {
              headers: {
                'x-auth-token': authState.token,
              },
            }),
            axios.get('http://localhost:5000/api/users/liked-portfolios', {
              headers: {
                'x-auth-token': authState.token,
              },
            }),
          ]);
  
          setUser(userResponse.data.user);
          setBio(userResponse.data.user.info || '');
          setFollowing(userResponse.data.user.following || []);
          setFollowers(userResponse.data.user.followers || []);
  
          const likedPortfoliosIds = likedPortfoliosResponse.data.map((p) => p._id);
          const updatedPortfolios = portfoliosResponse.data.map((portfolio) => ({
            ...portfolio,
            isLiked: likedPortfoliosIds.includes(portfolio._id),
          }));
          setPortfolios(updatedPortfolios);
          navigate(`/dashboard/${userResponse.data.userName}`);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching user data or portfolios:', error);
        toast.error('Failed to fetch user data or portfolios');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authState.isAuthenticated, navigate, userName]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users/conversations', {
          headers: {
            'x-auth-token': authState.token,
          },
        });
        
        setConversations(response.data);
  
        // Schedule the next fetch after a delay
        const timer = setTimeout(fetchConversations, 5000); // Fetch every 5 seconds
  
        // Clean up the timeout on component unmount
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
  
    if (authState.isAuthenticated) {
      fetchConversations();
    }
  }, [authState.isAuthenticated, authState.token]);

  useEffect(() => {
    const fetchLikedPortfolios = async () => {
      try {
        if (authState.isAuthenticated) {
          const response = await axios.get('http://localhost:5000/api/users/liked-portfolios', {
            headers: {
              'x-auth-token': authState.token,
            },
          });
          const likedPortfoliosIds = response.data.map((p) => p._id);
        setLikedPortfolios(response.data);
        setPortfolios((prevPortfolios) =>
          prevPortfolios.map((portfolio) => ({
            ...portfolio,
            isLiked: likedPortfoliosIds.includes(portfolio._id),
          }))
        );
      }
      } catch (error) {
        console.error('Error fetching liked portfolios:', error);
      }
    };

    fetchLikedPortfolios();
  }, [authState.isAuthenticated, authState.token]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterOpen]);

  

  const handleSendMessage = async () => {
    if (selectedConversation && messageContent.trim() !== '') {
      try {
        await axios.post(
          `http://localhost:5000/api/users/messages/${selectedConversation.recipient._id}`,
          { content: messageContent },
          {
            headers: {
              'x-auth-token': authState.token,
            },
          }
        );
        setMessageContent('');
        const response = await axios.get('http://localhost:5000/api/users/conversations', {
          headers: {
            'x-auth-token': authState.token,
          },
        });
        setConversations(response.data);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const toggleMessagesPopup = () => {
    setShowMessagesPopup(!showMessagesPopup);
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.recipient.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post('http://localhost:5000/api/users/upload', formData, {
        headers: {
          'x-auth-token': authState.token,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.profilePicture) {
        setUser({
          ...user,
          profilePicture: `data:${response.data.profilePicture.contentType};base64,${response.data.profilePicture.data}`,
        });
        toast.success('Profile picture uploaded successfully');
      } else {
        toast.error('Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    }
  };

  const handleBioChange = (e) => {
    setBio(e.target.value);
  };

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        'http://localhost:5000/api/users',
        { info: bio },
        {
          headers: {
            'x-auth-token': authState.token,
          },
        }
      );
      toast.success('Bio updated successfully');
    } catch (error) {
      console.error('Error updating bio:', error);
      toast.error('Failed to update bio');
    }
  };

  const handleAddPortfolio = async (newPortfolio) => {
    try {
      const response = await axios.post('http://localhost:5000/api/portfolios', newPortfolio, {
        headers: {
          'x-auth-token': authState.token,
        },
      });
      setPortfolios([...portfolios, response.data]);
      toast.success('Portfolio added successfully');
    } catch (error) {
      console.error('Error adding portfolio:', error);
      toast.error('Failed to add portfolio');
    }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    try {
      await axios.delete(`http://localhost:5000/api/portfolios/${portfolioId}`, {
        headers: {
          'x-auth-token': authState.token,
        },
      });
      setPortfolios(portfolios.filter((portfolio) => portfolio._id !== portfolioId));
      toast.success('Portfolio deleted successfully');
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      toast.error('Failed to delete portfolio');
    }
  };

  const handleUploadImage = async (portfolioId, file, description) => {
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

      // Update the portfolio with the new image
      const updatedPortfolios = portfolios.map((portfolio) => {
        if (portfolio._id === portfolioId) {
          return {
            ...portfolio,
            images: [...portfolio.images, response.data],
          };
        }
        return portfolio;
      });
      setPortfolios(updatedPortfolios);

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    clearAuthInfo();
    navigate('/');
  };

  const handleSearchUserChange = (event) => {
    setSearchUser(event.target.value);
  };

  const handleSearchUserSubmit = (event) => {
    event.preventDefault();
    navigate(`/dashboard/${searchUser}/public`);
  };

  const handleClickOutside = (event) => {
    if (filterOpen && filterRef.current && !filterRef.current.contains(event.target)) {
      setFilterOpen(false);
    }
  };



  if (loading) {
    return <Spinner />;
  }

  const toggleFollowingPopup = () => {
    setShowFollowingPopup(!showFollowingPopup);
  };

  const toggleFollowersPopup = () => {
    setShowFollowersPopup(!showFollowersPopup);
  };

  const handleUserClick = (username) => {
    if (authState.isAuthenticated && authState.user.userName === username) {
      navigate(`/dashboard/${authState.user.userName}`);
    } else {
      navigate(`/dashboard/${username}/public`);
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

  const handleConversationToggle = (conversation) => {
    if (selectedConversation && conversation._id === selectedConversation._id) {
      setSelectedConversation(null);
    } else {
      setSelectedConversation(conversation);
    }
  };

  const toggleLikedPortfolios = () => {
    setShowLikedPortfolios(!showLikedPortfolios);
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
          <button className='dashboard-LogoutButton' type="submit">Search</button>
        </form>
        <div className="liked-portfolios-info">
          <button onClick={toggleLikedPortfolios}>Liked Portfolios</button>
          {showLikedPortfolios && (
            <div className="overlay">
              <div className="liked-portfolios-popup">
                <h2>Liked Portfolios</h2>
                <ul>
                  {likedPortfolios.map((portfolio) => (
                    <li key={portfolio._id}>
                      <h3>
                        <a href={`/portfolio-details/${portfolio._id}`}>{portfolio.portfolioName}</a>
                      </h3>
                      <p>{portfolio.description}</p>
                      <p>Owner: {portfolio.userName}</p>
                    </li>
                  ))}
                </ul>
                <button className="close-button" onClick={toggleLikedPortfolios}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="messages-info">
          <button onClick={toggleMessagesPopup}>Messages</button>
          {showMessagesPopup && (
            <div className="overlay">
              <div className="messages-popup">
                <h2>Messages</h2>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <ul>
                  {filteredConversations.map((conversation) => (
                    <li
                      key={conversation._id}
                      onClick={() => handleConversationToggle(conversation)}
                    >
                      {conversation.recipient.userName}
                    </li>
                  ))}
                </ul>
                {selectedConversation && (
                  <div className="conversation-view">
                    <h3>Conversation with {selectedConversation.recipient.userName}</h3>
                    <ul>
                      {selectedConversation.messages.map((message, index) => (
                        <li key={index}>
                          <strong>{message.sender.userName}: </strong>
                          {message.content}
                        </li>
                      ))}
                    </ul>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                    />
                    <button onClick={handleSendMessage}>Send</button>
                  </div>
                )}
                <button className="close-button" onClick={toggleMessagesPopup}>
                  Close
                </button>
              </div>
            </div>
          )}

          <button className='dashboard-LogoutButton' onClick={handleLogout}>Logout</button>
        </div>

      </header>
      <div className="main-content">
        <div className="dashboard-header">
          {user && user.profilePicture && user.profilePicture.data ? (
            <img
              src={`data:${user.profilePicture.contentType};base64,${user.profilePicture.data.toString('base64')}`}
              alt="Profile"
            />
          ) : (
            <div className="empty-profile-picture">No profile picture</div>
          )}
          <label htmlFor="file-upload" className="custom-file-upload">
            Choose Profile Pic
          </label>
          <input id="file-upload" type="file" onChange={handleFileChange} />

          <h1>Welcome To Your Dashboard, {user ? user.userName : ''}!</h1>

          <div className="follow-info">
            <div className="following-info">
              <button onClick={toggleFollowingPopup}>Following: {following.length}</button>
              {showFollowingPopup && (
                <div className="overlay">
                  <div className="follow-popup" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <h2>Following</h2>
                    <ul>
                      {following.map((user) => (
                        <li key={user._id} onClick={() => handleUserClick(user.userName)}>
                          {user.userName}
                        </li>
                      ))}
                    </ul>
                    <button className="close-button" onClick={toggleFollowingPopup}>Close</button>
                  </div>
                </div>
              )}
            </div>

            <div className="followers-info">
              <button onClick={toggleFollowersPopup}>Followers: {followers.length}</button>
              {showFollowersPopup && (
                <div className="overlay">
                  <div className="follow-popup" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <h2>Followers</h2>
                    <ul>
                      {followers.map((user) => (
                        <li key={user._id} onClick={() => handleUserClick(user.userName)}>
                          {user.userName}
                        </li>
                      ))}
                    </ul>
                    <button className="close-button" onClick={toggleFollowersPopup}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>


          <form onSubmit={handleBioSubmit}>
            <textarea value={bio} onChange={handleBioChange} placeholder="Enter your bio" />
            <button className='dashboard-updateBio' type="submit">Update Bio</button>
          </form>
        </div>

        <section2>
          <h2 className='urPorts'>Your Portfolios</h2>
          <PortfolioList
            portfolios={portfolios}
            onUploadImage={handleUploadImage}
            onDeletePortfolio={handleDeletePortfolio}
            onLikePortfolio={handleLikePortfolio}
            onUnlikePortfolio={handleUnlikePortfolio}
            showAddPortfolioForm={true}
            onAddPortfolio={handleAddPortfolio}
          />

        </section2>
      </div>
    </div>
  );
};

export default Dashboard; 