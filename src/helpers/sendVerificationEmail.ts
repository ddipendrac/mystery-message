import { resend } from "@/lib/resend"; // Import Resend API client for sending emails
import VerificationEmail from "../../emails/VerificationEmail"; // Email template component
import { ApiResponse } from "@/types/ApiResponse"; // Type definition for API responses

/**
 * Sends a verification email with a one-time verification code.
 * 
 * @param {string} email - Recipient's email address.
 * @param {string} username - The username of the recipient.
 * @param {string} verifyCode - The verification code to be sent.
 * @returns {Promise<ApiResponse>} - A promise resolving to an API response indicating success or failure.
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    // Send an email using the Resend API
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Sender's email address (configured in Resend)
      to: email, // Recipient's email address
      subject: 'Mystery message | Verification code', // Email subject
      react: VerificationEmail({ username, otp: verifyCode }) // Email body using a React component
    });

    // Return success response if email is sent successfully
    return { success: true, message: "Verification email sent successfully" };
  } catch (emailError) {
    // Log the error if email sending fails
    console.log("Error sending verification email", emailError);

    // Return failure response
    return { success: false, message: "Failed to send verification email" };
  }
}
