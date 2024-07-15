import React from 'react';
import { Link } from 'react-router-dom';
import '../css/PortfolioList.css';
import AddPortfolioForm from './AddPortfolioForm';

const PortfolioList = ({ portfolios, onDeletePortfolio, isPublicDashboard, onLikePortfolio, onUnlikePortfolio, onAddPortfolio, showAddPortfolioForm }) => {
  return (
    <div className="portfolio-list">
      {showAddPortfolioForm && (
        <div className="portfolio-card add-portfolio-card">
          <AddPortfolioForm onAddPortfolio={onAddPortfolio} />
        </div>
      )}
      {portfolios.map((portfolio) => (
        <div key={portfolio._id} className="portfolio-card">
          <div className="like-info">
            <span>{portfolio.likes} likes</span>
            {portfolio.isLiked ? (
              <button onClick={() => onUnlikePortfolio(portfolio._id)}>Unlike</button>
            ) : (
              <button onClick={() => onLikePortfolio(portfolio._id)}>Like</button>
            )}
          </div>
          <h3>
            <Link to={`/portfolio-details/${portfolio._id}`}>{portfolio.portfolioName}</Link>
            
          </h3>
          <p>{portfolio.description}</p>
          
          {!isPublicDashboard && (
              <button className="delete-portfolio-btn" onClick={() => onDeletePortfolio(portfolio._id)}>
                Delete Portfolio
              </button>
            )}
        </div>
      ))}
    </div>
  );
};

export default PortfolioList; 