// Connects to the database using dbConnect().
// Extracts the username and code from the request body(Frontend).
// Finds the user in the database using the username.
// Validates the verification code:
// If the user is not found, it returns a "User not found" error.
// If the code matches and hasn't expired, it marks the user as verified.
// If the code has expired, it prompts the user to sign up again.
// If the code is incorrect, it returns an "Incorrect verification code" error.
// Handles errors gracefully, logging them and returning a 500 status if something goes wrong.

import UserModel from "@/model/User"; // Mongoose model for the User collection
import { z } from "zod"; // Zod is used for validation (though it's not being utilized here)
import dbConnect from "@/lib/dbConnect"; // Function to connect to the MongoDB database

export async function POST(request: Request) {
  // Step 1: Establish connection to the database
  await dbConnect();

  try {
    // Step 2: Extract username and verification code from the request body
    const { username, code } = await request.json();

    // Step 3: Decode the username (to handle URL encoding)
    const decodedUsername = decodeURIComponent(username);

    // Step 4: Check if the user with the provided username exists
    const user = await UserModel.findOne({ username: decodedUsername });

    // If no user is found, return a "User not found" error
    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found", // User doesn't exist in the database
        },
        { status: 404 } // Not Found
      );
    }

    // Step 5: Check if the verification code is valid and if it has expired
    const isCodeValid = user.verifyCode === code; // Check if the code matches
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date(); // Check if the code is still valid (not expired)

    // Step 6: If the code is valid and not expired, verify the user's account
    if (isCodeValid && isCodeNotExpired) {
      user.isVerified = true; // Mark the user as verified
      await user.save(); // Save the updated user document in the database

      // Return a success response indicating the account was verified
      return Response.json(
        {
          success: true,
          message: "Account verified successfully", // Success message
        },
        { status: 200 } // OK (Success)
      );
    } 
    // Step 7: If the code has expired, return an error response
    else if (!isCodeNotExpired) {
      return Response.json(
        {
          success: false,
          message: "Verification code has expired. Please sign up again to get new code", // Code has expired
        },
        { status: 400 } // Bad Request (because the verification code has expired)
      );
    } 
    // Step 8: If the code is incorrect, return an error response
    else {
      return Response.json(
        {
          success: false,
          message: "Incorrect verification code", // Incorrect code provided
        },
        { status: 400 } // Bad Request (because the code is incorrect)
      );
    }

  } catch (error) {
    // Step 9: Catch any errors that occur during the process and log them
    console.error("Error verifying user", error);

    // Step 10: Return an error response if an exception occurs
    return Response.json(
      {
        success: false,
        message: "Error verifying user", // General error message
      },
      { status: 500 } // Internal server error status code
    );
  }
}
