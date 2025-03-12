// Import necessary dependencies and functions.
import { getServerSession } from "next-auth"; // For fetching the current user's session.
import { authOptions } from "../auth/[...nextauth]/options"; // Authentication settings/options.
import dbConnect from "@/lib/dbConnect"; // Function to connect to the database.
import UserModel from "@/model/User"; // Mongoose model for users.
import { User } from "next-auth"; // Type definition for the user object.

export async function POST(request: Request) {
  // Establish connection to the database before performing any operations.
  await dbConnect();

  // Get the session for the current user from NextAuth.
  const session = await getServerSession(authOptions);
  // Typecast the user from session to match the User model.
  const user: User = session?.user as User;

  // Check if the session exists. If not, return an unauthorized error.
  if (!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Not authenticated", // If user is not authenticated, return this message.
      },
      { status: 401 } // HTTP status code 401: Unauthorized.
    );
  }

  // Extract the user ID from the session.
  const userId = user._id;

  // Extract the "acceptMessage" value from the request body (JSON format).
  const { acceptMessage } = await request.json();

  try {
    // Update the user's "isAcceptingMessage" status in the database.
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId, // Find the user by ID.
      { isAcceptingMessage: acceptMessage }, // Update the "isAcceptingMessage" field.
      { new: true } // Return the updated user object.
    );

    // If user update fails, return an error response.
    if (!updatedUser) {
      return Response.json(
        {
          success: false,
          message: "failed to update user status to accept messages",
        },
        { status: 500 } // HTTP status code 500: Server Error.
      );
    }

    // Return a success response indicating the status was updated.
    return Response.json(
      {
        success: true,
        message: "Messages acceptance status updated successfully", // Success message.
      },
      { status: 200 } // HTTP status code 200: OK.
    );
  } catch (error) {
    // Log any error that occurs during the update process.
    console.log("Failed to update user status to accept messages");
    // Return a response indicating the failure of the operation.
    return Response.json(
      {
        success: false,
        message: "failed to update user status to accept messages", // Error message.
      },
      { status: 500 } // HTTP status code 500: Server Error.
    );
  }
}

export async function GET(request: Request) {
  // Establish connection to the database before performing any operations.
  await dbConnect();

  // Get the session for the current user from NextAuth.
  const session = await getServerSession(authOptions);
  // Typecast the user from session to match the User model.
  const user: User = session?.user as User;

  // Check if the session exists. If not, return an unauthorized error.
  if (!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Not authenticated", // If user is not authenticated, return this message.
      },
      { status: 401 } // HTTP status code 401: Unauthorized.
    );
  }

  // Extract the user ID from the session.
  const userId = user._id;

  try {
    // Find the user in the database by user ID.
    const foundUser = await UserModel.findById(userId);

    // If the user is not found, return a "user not found" error.
    if (!foundUser) {
      return Response.json(
        {
          success: false,
          message: "User not found", // If no user is found, return this message.
        },
        { status: 404 } // HTTP status code 404: Not Found.
      );
    }

    // Return the current message acceptance status of the user.
    return Response.json(
      {
        success: true,
        isAcceptingMessages: foundUser.isAcceptingMessage, // Return the user's message acceptance status.
      },
      { status: 200 } // HTTP status code 200: OK.
    );
  } catch (error) {
    // Log any error that occurs during the fetching process.
    console.log("Failed to update user status to accept messages");
    // Return a response indicating the failure of the operation.
    return Response.json(
      {
        success: false,
        message: "Error in getting messages acceptance status", // Error message.
      },
      { status: 500 } // HTTP status code 500: Server Error.
    );
  }
}
