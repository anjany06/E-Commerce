import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";
import {
  EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
} from "../config/emailTemplates.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};
//Route for user Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // BUG: No input validation - email and password not checked if empty
    const user = await userModel.findOne({ email }); // BUG: No sanitization of email input

    // Check if user exists
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Compare password only if user exists
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = createToken(user._id);
      return res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//Route for user Registration
const registerUser = async (req, res) => {
  try {
    const { name, password, email } = req.body;

    // checking user already exits
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "user already exists" });
    }
    // validating email format and strong password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Invalid email format" });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password (min 8 charcters)",
      });
    }

    //hashing pssword
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();

    const token = createToken(user._id);

    //to send welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to UrbanVault-Ecommerce Website",
      text: `Hi ${name}, we're thrilled to have you here! Explore amazing features and make the most of your journey with us—your ultimate shopping destination! Your email id is ${email} 🚀`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Route for admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { loginUser, registerUser, adminLogin };

//send password reset otp
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User Not found" });
    }

    //creating a 6 six digit otp for verfication
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    //otp expires in 15 minutes
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

    await user.save();
    //send otp to user's email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP for reset password is ${otp}. Use this OTP to proceed with resetting your password.`,
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email,
      ),
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

//Reset user Password

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: "All fields are required" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();
    return res.json({
      success: true,
      message:
        "Password has been reset successfully (login again with new password)",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
//send verfication otp to the user's email
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (user.isAccountVerified) {
      return res.json({
        success: false,
        message: "Account is already verified",
      });
    }
    //creating a 6 six digit otp for verfication
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    //otp expires in one day
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();
    //send otp to user's email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      // text: `Your OTP is ${otp}. Verify your account using this OTP.`,
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email,
      ),
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Verification OTP sent on Email" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
//email verfication checker
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing Details" });
  }
  try {
    const user = await userModel.findById(userId);
    if (!userId) {
      return res.json({ success: false, message: "user not found" });
    }

    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    //checks whether the otp expires
    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP has expired" });
    }

    //after the account verification
    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();

    return res.json({ success: true, message: "Email verified Successfully" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

//to get the user  information
export const getUserData = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User  not found" });
    }

    res.json({
      success: true,
      name: user.name,
      email: user.email,
      isAccountVerified: user.isAccountVerified,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

//update email
export const emailUpdate = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.email = req.body.email;
    await user.save();

    res.json({ success: true, message: "Email updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update email" });
  }
};

//update Name
export const nameUpdate = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.name = req.body.name;
    await user.save();

    res.json({ success: true, message: "Name updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update name" });
  }
};
