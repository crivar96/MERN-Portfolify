import React, { useState } from 'react';
import "../css/AddPortfolioForm.css";

const AddPortfolioForm = ({ onAddPortfolio }) => {
  const [portfolioName, setPortfolioName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (portfolioName.trim() && description.trim()) {
      onAddPortfolio({ portfolioName, description });
      setPortfolioName('');
      setDescription('');
    }
  };

  return (
    <div className="add-portfolio-form">
      <h3>Add New Portfolio</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="portfolioName">Portfolio Name</label>
          <input
            type="text"
            id="portfolioName"
            value={portfolioName}
            onChange={(event) => setPortfolioName(event.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </div>
        <button type="submit">Add Portfolio</button>
      </form>
    </div>
  );
};
export default AddPortfolioForm;