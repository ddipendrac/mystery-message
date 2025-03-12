// Import necessary dependencies for NextAuth.
import { NextAuthOptions } from "next-auth"; // Types for configuring NextAuth.
import CredentialsProvider from "next-auth/providers/credentials"; // Credentials provider for custom authentication.
import bcrypt from "bcryptjs"; // Library for password hashing and comparison.
import dbConnect from "@/lib/dbConnect"; // Function to establish a database connection.
import UserModel from "@/model/User"; // Mongoose model for the User collection in the database.

// Configuring NextAuth options for authentication
export const authOptions: NextAuthOptions = {
  // Define the authentication providers, in this case, credentials-based login
  providers: [
    CredentialsProvider({
      id: "credentials", // Unique identifier for this provider.
      name: "Credentials", // Display name of the provider.
      credentials: {
        identifier: { label: "Email or Username", type: "text" }, // Input field for email or username.
        password: { label: "Password", type: "password" }, // Input field for password.
      },
      // Custom authentication logic for the provider.
      async authorize(credentials: any): Promise<any> {
        // Establish connection to the database.
        await dbConnect();

        try {
          // Look for the user by either email or username in the database.
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.identifier }, // Search by email.
              { username: credentials.identifier }, // Or search by username.
            ],
          });

          // If no user is found, throw an error.
          if (!user) {
            throw new Error("No user found with this email");
          }

          // Check if the user's account is verified before allowing login.
          if (!user.isVerified) {
            throw new Error('Please verify your account before login');
          }

          // Compare the password provided in the credentials with the hashed password in the database.
          const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

          // If the password is correct, return the user object.
          if (isPasswordCorrect) {
            return user;
          } else {
            // If the password is incorrect, throw an error.
            throw new Error('Incorrect password');
          }
        } catch (err: any) {
          // Catch any errors during the authentication process and throw an error with the message.
          throw new Error(err.message);
        }
      }
    })
  ],

  // Define callbacks for handling JWT and session information.
  callbacks: {
    // Customize session callback to include user information in the session.
    async session({ session, token }) {
      if (token) {
        // Add custom user properties to the session based on the token.
        session.user._id = token._id;
        session.user.isVerified = token.isVerified;
        session.user.isAcceptingMessages = token.isAcceptingMessages;
        session.user.username = token.username;
      }
      return session; // Return the updated session.
    },

    // Customize JWT callback to include additional user information in the JWT token.
    async jwt({ token, user }) {
      if (user) {
        // Add user details (like _id, isVerified, etc.) to the JWT token.
        token._id = user._id?.toString();
        token.isVerified = user.isVerified;
        token.isAcceptingMessages = user.isAcceptingMessages;
        token.username = user.username;
      }
      return token; // Return the updated token.
    }
  },

  // Define custom pages, for example, the sign-in page.
  pages: {
    signIn: '/sign-in' // Custom sign-in page URL.
  },

  // Specify session management strategy. Using JWT here.
  session: {
    strategy: "jwt" // Store session using JWT (JSON Web Token).
  },

  // Define a secret key used for signing tokens and sessions.
  secret: process.env.NEXTAUTH_SECRET, // Fetch the secret from environment variables.
}
