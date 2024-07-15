// combinedRoutes.js

const express = require('express');
const router = express.Router();
const combinedController = require('../../controllers/combinedController');
const authMiddleware = require('../../middleware/authMiddleware');
const upload = require('../../utils/multerUpload');
const multer = require('multer');
const profileUpload = multer({ dest: '../../uploads/' });

// Auth routes
router.post('/auth/login', combinedController.loginUser);

// Image routes
router.post('/images', authMiddleware, upload.single('image'), combinedController.uploadImage);
router.get('/images/portfolio/:portfolioId', combinedController.getImagesByPortfolioId);
router.delete('/images/:id', authMiddleware, combinedController.deleteImage);

// Portfolio routes
router.get('/portfolios', authMiddleware, combinedController.getAllPortfolios);
router.post('/portfolios', authMiddleware, combinedController.createPortfolio);
router.get('/portfolios/:id', combinedController.getPublicPortfolio);
router.get('/portfolios/:id/private', authMiddleware, combinedController.getPortfolioById);
router.delete('/portfolios/:id', authMiddleware, combinedController.deletePortfolio);

// User routes
router.post('/users', combinedController.registerUser);
router.get('/users', authMiddleware, combinedController.getUserData);
router.post('/users/upload', authMiddleware, profileUpload.single('profilePicture'), combinedController.uploadProfilePicture);
router.put('/users', authMiddleware, combinedController.updateUserBio);
router.get('/users/:userName/public', combinedController.getUserByUsername);
router.post('/users/follow/:userId', authMiddleware, combinedController.followUser);
router.get('/users/checkfollow/:userId', authMiddleware, combinedController.checkFollowStatus);
router.post('/users/messages/:recipientId', authMiddleware, combinedController.sendMessage);
router.get('/users/conversations', authMiddleware, combinedController.getConversations);

router.post('/portfolios/:id/like', authMiddleware, combinedController.likePortfolio);
router.post('/portfolios/:id/unlike', authMiddleware, combinedController.unlikePortfolio);
router.get('/users/liked-portfolios', authMiddleware, combinedController.getLikedPortfolios);

router.get('/users/followed-portfolios', authMiddleware, combinedController.getFollowedUserPortfolios);

module.exports = router;