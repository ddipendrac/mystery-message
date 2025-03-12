// Import necessary functions and libraries
import { getServerSession } from "next-auth"; // Function to retrieve the current session.
import { authOptions } from "../auth/[...nextauth]/options"; // Authentication options used by NextAuth.
import dbConnect from "@/lib/dbConnect"; // Function to connect to the MongoDB database.
import UserModel from "@/model/User"; // Mongoose model for the User collection.
import { User } from "next-auth"; // Type definition for the user object in NextAuth.
import mongoose from "mongoose"; // Mongoose library used for database operations.

// Define the POST handler function for this API route.
export async function POST(request: Request) {
  // First, establish a connection to the database.
  await dbConnect();

  // Retrieve the session using getServerSession, which provides the current user session.
  const session = await getServerSession(authOptions);
  
  // Type cast the session user to match the User type.
  const user: User = session?.user as User;

  // Check if the session does not exist or if the user is not authenticated.
  if (!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Not authenticated" // Return an error if not authenticated.
      },
      { status: 401 } // Unauthorized status code.
    );
  }

  // Convert the user’s _id from string to a mongoose ObjectId type for querying MongoDB.
  const userId = new mongoose.Types.ObjectId(user._id);

  try {
    // Use MongoDB aggregation to retrieve and process messages for the authenticated user.
    const user = await UserModel.aggregate([
      { $match: { _id: userId } }, // Filter users to find the document with the matching userId.
      { $unwind: '$messages' }, // Unwind the messages array so that each message is treated as a separate document.
      { $sort: { 'messages.createdAt': -1 } }, // Sort the messages in descending order by their creation date.
      { 
        $group: { 
          _id: '$_id', // Group the messages back into the original user document.
          messages: { $push: "$messages" } // Push the messages back into an array under the 'messages' field.
        } 
      }
    ]);

    // If no user or messages are found, return an error response.
    if (!user || user.length === 0) {
      return Response.json(
        {
          success: false,
          message: "User not found" // Return an error if the user is not found.
        },
        { status: 401 } // Unauthorized status code.
      );
    }

    // Return a successful response with the messages array.
    return Response.json(
      {
        success: true,
        message: user[0].messages // Send the user's messages as part of the response.
      },
      { status: 200 } // OK status code.
    );
  } catch (error) {
    // If an error occurs during the database operation, log the error and return a generic error response.
    console.error("Error fetching messages:", error);
    return Response.json(
      {
        success: false,
        message: "Internal server error" // Return a general error message.
      },
      { status: 500 } // Internal server error status code.
    );
  }
}
