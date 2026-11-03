const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    otp: {
      type: String,
      required: true,
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

OtpSchema.index({ userId: 1 }, { unique: true });
OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model('otps', OtpSchema);
