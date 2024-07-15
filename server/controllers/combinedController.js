const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Image = require('../models/image');
const Portfolio = require('../models/portfolio');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

exports.loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
  
  
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
  
      // Check if password matches
      const isMatch = await bcrypt.compare(password, user.saltedPassword);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
  
      const payload = {
        user: {
          _id: user._id,
          name: user.userName,
          email: user.email,
          phoneNumber: user.contactPhoneNumber,
        },
      };
  
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, user: payload.user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  };

  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
      },
    }),
  });
  
  exports.getImagesByPortfolioId = async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
  
      const images = await Image.find({ portfolioId });
  
      res.json(images);
    } catch (error) {
      console.error('Error fetching images:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  exports.uploadImage = async (req, res) => {
    try {
      const file = req.file;
      const user = req.user;
      const portfolioId = req.body.portfolioId;
  
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
  
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      const fileData = fs.readFileSync(file.path);
  
      const imageData = {
        imageName: file.filename,
        file: {
          data: fileData,
          contentType: file.mimetype,
        },
        description: req.body.description || '',
        portfolioId,
      };
  
      const newImage = await Image.create(imageData);
  
      const updatedPortfolio = await Portfolio.findByIdAndUpdate(
        portfolioId,
        { $push: { images: newImage._id } },
        { new: true }
      ).populate('images');
  
      res.json(updatedPortfolio);
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  exports.deleteImage = async (req, res) => {
    try {
      const imageId = req.params.id;
      const user = req.user;
  
      const image = await Image.findById(imageId);
  
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }
  
      const portfolio = await Portfolio.findById(image.portfolioId);
  
      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
  
      if (portfolio.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
  
      // Delete the image file from the uploads directory
      const imagePath = path.join(__dirname, '..', 'uploads', image.imageName);
      try {
        fs.unlinkSync(imagePath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.warn('Image file not found:', imagePath);
          // Optional: You can choose to continue with the database deletion
          // even if the file is not found
        } else {
          console.error('Error deleting image file:', error);
          throw error; // Rethrow the error to be caught by the outer catch block
        }
      }
  
      await Image.deleteOne({ _id: imageId });
  
      const updatedPortfolio = await Portfolio.findByIdAndUpdate(
        portfolio._id,
        { $pull: { images: image._id } },
        { new: true }
      ).populate('images');
  
      res.json(updatedPortfolio);
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };

  exports.getPortfolioById = async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const user = req.user;
  
      const portfolio = await Portfolio.findById(portfolioId)
        .populate('images')
        .populate('userId', 'userName') // Populate the user information
        .exec();
  
      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
  
      if (portfolio.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
  
      res.json(portfolio);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  exports.getAllPortfolios = async (req, res) => {
    try {
      const user = req.user;
  
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
  
      const portfolios = await Portfolio.find({ userId: user._id })
        .populate('images')
        .exec();
  
      res.json(portfolios);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  exports.createPortfolio = async (req, res) => {
    try {
      const { portfolioName, description } = req.body;
      const user = req.user;
  
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
  
      const portfolio = new Portfolio({
        portfolioName,
        description,
        userId: user._id,
      });
  
      await portfolio.save();
  
      // Update the user's portfolios array
      await User.findByIdAndUpdate(
        user._id,
        { $push: { portfolios: portfolio._id } },
        { new: true }
      );
  
      res.json(portfolio);
    } catch (error) {
      console.error('Error creating portfolio:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  exports.deletePortfolio = async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const user = req.user;
  
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
  
      const portfolio = await Portfolio.findById(portfolioId);
  
      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
  
      if (portfolio.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
  
      // Delete all associated images
      await Image.deleteMany({ portfolioId: portfolio._id });
  
      // Delete the portfolio
      await Portfolio.deleteOne({ _id: portfolio._id });
  
      // Update the user's portfolios array
      await User.findByIdAndUpdate(
        user._id,
        { $pull: { portfolios: portfolio._id } },
        { new: true }
      );
  
      res.json({ message: 'Portfolio deleted successfully' });
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  exports.getPublicPortfolio = async (req, res) => {
    try {
      const portfolioId = req.params.id;
  
      const portfolio = await Portfolio.findById(portfolioId)
        .populate('images')
        .populate('userId', 'userName')
        .exec();
  
      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
  
      res.json(portfolio);
    } catch (error) {
      console.error('Error fetching public portfolio:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };

  exports.registerUser = async (req, res) => {
    try {
      const { userName, email, phoneNumber, password } = req.body;
  
      let user = await User.findOne({ $or: [{ email }, { userName }, { phoneNumber }] });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }
  
      user = new User({
        userName,
        email,
        contactPhoneNumber: phoneNumber,
        saltedPassword: await bcrypt.hash(password, 10),
        accountType: 'user',
      });
  
      await user.save();
  
      res.json({ msg: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  exports.getUserData = async (req, res) => {
    try {
      const user = req.user;
      const userData = await User.findOne({ _id: user._id })
        .populate('portfolios')
        .populate('following', 'userName')
    .populate('followers', 'userName')
        .select('-saltedPassword')
        .exec();
  
      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json({ user: userData, userName: userData.userName });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  exports.updateUserBio = async (req, res) => {
    try {
      const { info } = req.body;
      const userId = req.user._id;
  
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { info },
        { new: true }
      );
  
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user bio:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  
  
  exports.uploadProfilePicture = async (req, res) => {
    try {
      const user = req.user;
  
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
  
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      const fileData = await fs.promises.readFile(req.file.path);
      const base64Data = fileData.toString('base64');
  
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          profilePicture: {
            data: base64Data,
            contentType: req.file.mimetype,
          },
        },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json({ profilePicture: updatedUser.profilePicture });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  exports.getUserByUsername = async (req, res) => {
    try {
      const { userName } = req.params;
  
      const user = await User.findOne({ userName })
        .populate('portfolios')
        .populate('followers', 'userName')
        .populate('following', 'userName')
        .select('-saltedPassword')
        .exec();
  
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  exports.followUser = async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = await User.findById(req.user._id);
  
      // Check if the user is trying to follow themselves
      if (userId === currentUser._id.toString()) {
        return res.status(400).json({ msg: 'You cannot follow yourself' });
      }
  
      const userToFollow = await User.findById(userId);
      if (!userToFollow) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      if (!currentUser.following) {
        currentUser.following = [];
      }
      if (!userToFollow.followers) {
        userToFollow.followers = [];
      }
  
      // Check if the current user is already following the user
      if (currentUser.following.includes(userId)) {
        // Unfollow the user
        currentUser.following = currentUser.following.filter(
          (id) => id.toString() !== userId
        );
        userToFollow.followers = userToFollow.followers.filter(
          (id) => id.toString() !== currentUser._id.toString()
        );
      } else {
        // Follow the user
        currentUser.following.push(userId);
        userToFollow.followers.push(currentUser._id);
      }
  
      await currentUser.save();
      await userToFollow.save();
  
      res.json({ msg: 'User followed/unfollowed successfully' });
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  exports.checkFollowStatus = async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = await User.findById(req.user._id);
  
      const isFollowing = currentUser.following.includes(userId);
  
      res.json({ isFollowing });
    } catch (error) {
      console.error('Error checking follow status:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  // userController.js
  exports.sendMessage = async (req, res) => {
    try {
      const { recipientId } = req.params;
      const { content } = req.body;
      const senderId = req.user._id;
  
      // Find the sender and recipient users
      const sender = await User.findById(senderId);
      const recipient = await User.findById(recipientId);
  
      if (!recipient) {
        return res.status(404).json({ msg: 'Recipient not found' });
      }
  
      // Check if a conversation already exists between the sender and recipient
      let conversation = sender.conversations.find(
        (conv) => conv.recipient.toString() === recipientId
      );
  
      if (!conversation) {
        // If conversation doesn't exist, create a new one
        conversation = {
          recipient: recipientId,
          messages: [],
        };
        sender.conversations.push(conversation);
      }
  
      // Add the new message to the conversation
      conversation.messages.push({
        sender: senderId,
        content,
      });
  
      // Save the updated sender user
      await sender.save();
  
      let recipientConversation = recipient.conversations.find(
        (conv) => conv.recipient.toString() === senderId
      );
  
      if (!recipientConversation) {
        recipientConversation = {
          recipient: senderId,
          messages: [],
        };
        recipient.conversations.push(recipientConversation);
      }
  
      recipientConversation.messages.push({
        sender: senderId,
        content,
      });
  
      await recipient.save();
  
      res.json({ msg: 'Message sent successfully' });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  exports.getConversations = async (req, res) => {
    try {
      const userId = req.user._id;
  
      const user = await User.findById(userId)
        .populate('conversations.recipient', 'userName')
        .populate('conversations.messages.sender', 'userName')
        .exec();
  
      res.json(user.conversations);
    } catch (error) {
      console.error('Error retrieving conversations:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  };

  exports.likePortfolio = async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user._id;
  
      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      if (user.likedPortfolios.includes(portfolioId)) {
        return res.status(400).json({ error: 'Portfolio already liked' });
      }
  
      user.likedPortfolios.push(portfolioId);
      await user.save();
  
      portfolio.likes += 1;
      await portfolio.save();
  
      res.json({ message: 'Portfolio liked successfully' });
    } catch (error) {
      console.error('Error liking portfolio:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  exports.unlikePortfolio = async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user._id;
  
      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      if (!user.likedPortfolios.includes(portfolioId)) {
        return res.status(400).json({ error: 'Portfolio not liked' });
      }
  
      user.likedPortfolios = user.likedPortfolios.filter(
        (id) => id.toString() !== portfolioId
      );
      await user.save();
  
      portfolio.likes -= 1;
      await portfolio.save();
  
      res.json({ message: 'Portfolio unliked successfully' });
    } catch (error) {
      console.error('Error unliking portfolio:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  exports.getLikedPortfolios = async (req, res) => {
    try {
      const userId = req.user._id;
  
      const user = await User.findById(userId).populate({
        path: 'likedPortfolios',
        populate: {
          path: 'userId',
          select: 'userName',
        },
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const likedPortfolios = user.likedPortfolios.map((portfolio) => ({
        _id: portfolio._id,
        portfolioName: portfolio.portfolioName,
        description: portfolio.description,
        userName: portfolio.userId.userName,
      }));
  
      res.json(likedPortfolios);
    } catch (error) {
      console.error('Error retrieving liked portfolios:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };

  exports.getFollowedUserPortfolios = async (req, res) => {
    try {
      const userId = req.user._id;
  
      const user = await User.findById(userId).populate('following');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const followedUserIds = user.following.map((followedUser) => followedUser._id);
  
      const portfolios = await Portfolio.find({ userId: { $in: followedUserIds } })
        .populate('userId', 'userName')
        .sort({ createdAt: -1 })
        .exec();
  
      res.json(portfolios);
    } catch (error) {
      console.error('Error retrieving followed user portfolios:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };