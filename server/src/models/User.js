import mongoose from 'mongoose'

/**
 * A user account. Identity is delegated to Google, so no password is stored —
 * `googleId` is the stable subject claim from the verified Google ID token.
 */
const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    picture: {
      type: String,
      default: '',
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

/** Shape sent to the client. Keeps internal fields out of API responses. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    email: this.email,
    name: this.name,
    picture: this.picture,
    createdAt: this.createdAt,
  }
}

export const User = mongoose.model('User', userSchema)
