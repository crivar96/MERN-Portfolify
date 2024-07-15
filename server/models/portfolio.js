const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  portfolioName: {
    type: String,
    required: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  images: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
    },
  ],
  likes: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;