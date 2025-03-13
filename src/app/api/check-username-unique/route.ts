// Database Connection → Connects to MongoDB using dbConnect().
// Extracts Query Parameter → Retrieves username from the request URL.
// Validates Username → Uses Zod to ensure the username meets defined rules.
// Checks Database → Searches for an existing verified user with the same username.
// Response Handling:
// ✅ If the username is unique, returns { success: true, message: "Username is unique" }.
// ❌ If the username exists, returns { success: false, message: "Username is already taken" }.
// ❌ If validation fails or an error occurs, returns appropriate error messages.


import dbConnect from "@/lib/dbConnect"; // Function to establish a connection to the database.
import UserModel from "@/model/User"; // Mongoose model for the User collection in the database.
import { z } from "zod"; // Zod library for schema validation.
import { usernameValidation } from "@/schemas/signUpSchema"; // Custom username validation schema.

// Define a schema to validate the query parameters in the GET request using Zod.
const UsernameQuerySchema = z.object({
  username: usernameValidation // Using the custom username validation schema defined elsewhere.
});

export async function GET(request: Request) {
  // Establish connection to the database
  await dbConnect();

  try {
    // Get search parameters (query parameters) from the URL.
    const { searchParams } = new URL(request.url);

    // Extract the "username" parameter from the URL's query string.
    const queryParam = {
      username: searchParams.get("username")
    };

    // Validate the query parameter using the Zod schema.
    const result = UsernameQuerySchema.safeParse(queryParam);

    // If validation fails, return a 400 error with the validation error messages.
    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return Response.json({
        success: false,
        message: usernameErrors?.length > 0 ? usernameErrors.join(', ') : 'Invalid query parameters'
      }, { status: 400 });
    }

    // Destructure the validated username from the result data.
    const { username } = result.data;

    // Check if the username already exists in the database and is verified.
    const existingVerifiedUser = await UserModel.findOne({ username, isVerified: true });

    // If the username already exists and is verified, return a 400 error.
    if (existingVerifiedUser) {
      return Response.json({
        success: false,
        message: 'Username is already taken'
      }, { status: 400 });
    }

    // If no user is found with the given username, return success with a message.
    return Response.json({
      success: true,
      message: 'Username is unique'
    }, { status: 200 });

  } catch (error) {
    // If there is any error during the process, log the error and return a 500 response.
    console.error("Error checking username", error);
    return Response.json(
      {
        success: false,
        message: "Error checking username"
      },
      { status: 500 }
    );
  }
}
