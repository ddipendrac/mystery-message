// Import necessary modules
import dbConnect from "@/lib/dbConnect"; // Function to establish a connection to the MongoDB database.
import UserModel from "@/model/User"; // Mongoose model for the User collection.
import { Message } from "@/model/User"; // Type definition for the Message object in the User model.

export async function POST(request: Request) {
  // Step 1: Connect to the database before making any queries.
  await dbConnect();

  // Step 2: Extract the 'username' and 'content' from the request body.
  const { username, content } = await request.json(); 

  try {
    // Step 3: Find the user document by username.
    const user = await UserModel.findOne({ username });

    // Step 4: Check if the user exists.
    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found", // If no user is found, return a 404 error.
        },
        { status: 404 }
      );
    }

    // Step 5: Check if the user is accepting messages.
    if (!user.isAcceptingMessage) {
      return Response.json(
        {
          success: false,
          message: "User is not accepting messages", // If the user is not accepting messages, return a 403 error.
        },
        { status: 403 }
      );
    }

    // Step 6: Create a new message object with content and the current date/time.
    const newMessage = { content, createdAt: new Date() };

    // Step 7: Add the new message to the user's 'messages' array.
    user.messages.push(newMessage as Message); // Type cast the message to fit the 'Message' type in the User model.
    
    // Step 8: Save the updated user document with the new message.
    await user.save();

    // Step 9: Return a successful response with the new message.
    return Response.json(
      { success: true, message: "Message added successfully", newMessage }, // Return the success response.
      { status: 201 } // Created status code.
    );
  } catch (error) {
    // Step 10: Catch any errors that occur during the process.
    console.error("Error adding message:", error);

    // Step 11: Return an error response if an exception is thrown.
    return Response.json(
      { success: false, message: "Internal server error" }, // General error message.
      { status: 500 } // Internal server error status code.
    );
  }
}
