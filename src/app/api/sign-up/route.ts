// This POST API registers a new user and sends an email verification code.

// 🚀 Steps:
// Connects to MongoDB using dbConnect().
// Extracts Data (username, email, password) from the request.
// Checks for Existing Users:
// If a verified user exists with the username → Returns 400 (User already taken).
// If an unverified user exists with the email:
// Updates their password, generates a new verification code, and sets an expiry.
// Otherwise, creates a new user and saves it to the database.
// Sends Verification Email using sendVerificationEmail().
// Handles Email Response:
// ✅ If email sent → Returns 201 (User registered successfully, verify email).
// ❌ If email fails → Returns 500 (Error sending verification email).
// Catches Any Errors and returns a 500 (Internal Server Error).


import dbConnect from "@/lib/dbConnect"; // Import database connection function
import UserModel from "@/model/User"; // Import User model for database operations
import bcrypt from "bcryptjs"; // Import bcrypt for password hashing

import { sendVerificationEmail } from "@/helpers/sendVerificationEmail"; // Import function to send verification email

// Define an async POST request handler for user registration
export async function POST(request: Request) {
  await dbConnect(); // Establish a database connection

  try {
    // Parse the incoming request body to extract user data
    const { username, email, password } = await request.json();

    // Check if a verified user with the same username already exists
    const existingUserVerifiedByUserName = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingUserVerifiedByUserName) {
      return Response.json(
        {
          success: false,
          message: "User is already taken", // Inform user that the username is not available
        },
        { status: 400 } // Return HTTP 400 (Bad Request)
      );
    }

    // Check if a user with the same email exists in the database
    const existingUserByEmail = await UserModel.findOne({ email });

    // Generate a 6-digit random verification code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      // If the user exists and is already verified, return an error
      if (existingUserByEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: "User already exists with this email",
          },
          { status: 400 }
        );
      } else {
        // If the user exists but is not verified, update their password and verification code
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000); // Set expiry to 1 hour from now
        await existingUserByEmail.save(); // Save updated user details
      }
    } else {
      // If the user does not exist, create a new user entry
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1); // Set verification code expiry to 1 hour later

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false, // New user is not verified initially
        isAcceptingMessage: true, // Enable messages by default
        messages: [], // Initialize empty messages array
      });

      await newUser.save(); // Save the new user in the database
    }

    // Send verification email to the user
    const emailResponse = await sendVerificationEmail(email, username, verifyCode);

    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message, // Return email error message
        },
        { status: 500 } // Internal Server Error
      );
    }

    // If everything is successful, return a success response
    return Response.json(
      {
        success: true,
        message: "User registered successfully. Please verify your email",
      },
      { status: 201 } // HTTP 201 (Created)
    );
  } catch (error) {
    console.log("Error registering user", error);
    return Response.json(
      {
        success: false,
        message: "Error registering user", // Generic error message
      },
      { status: 500 } // Internal Server Error
    );
  }
}
