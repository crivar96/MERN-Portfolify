const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100,
  },
  saltedPassword: {
    type: String,
    required: true,
    maxlength: 100,
  },
  accountType: {
    type: String,
    maxlength: 100,
  },
  contactPhoneNumber: {
    type: String,
    required: true,
    maxlength: 100,
  },
  profilePicture: {
    data: String,
    contentType: String,
  },
  info: {
    type: String,
    maxlength: 500,
  },
  portfolios: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
    },
  ],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  conversations: [
    {
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      messages: [
        {
          sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          content: String,
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  ],
  likedPortfolios: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
    },
  ],

});

const User = mongoose.model('User', userSchema);

module.exports = User;