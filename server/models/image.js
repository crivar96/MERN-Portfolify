const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  imageName: {
    type: String,
    required: true,
    maxlength: 100,
  },
  file: {
    data: Buffer,
    contentType: String,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
  },
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;