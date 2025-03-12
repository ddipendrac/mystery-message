// Import the NextAuth function from next-auth to set up authentication in the application.
import NextAuth from "next-auth";
// Import the authentication options defined in the "options.ts" file.
import { authOptions } from "./options";

// Create the NextAuth handler using the authentication options.
const handler = NextAuth(authOptions);

// Export the handler to handle both GET and POST requests for authentication.
// This means NextAuth will handle the authentication process for both request methods.
export { handler as GET, handler as POST };
