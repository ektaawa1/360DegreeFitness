const mongoose = require("mongoose");
const {Schema} = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: [true, "An account with this username already exists."],
      minlength: [4, "Username must be 4-15 characters."],
      maxlength: [15, "Username must be 4-15 characters."],
      lowercase: true,
    },
      name: {
          type: String,
          required: [true, "Name is required."],
      },
    password: {
      type: String,
      required: [true, "Password is required."],
    }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
