'use client'  // Ensure this component runs on the client side

import { SessionProvider } from "next-auth/react" // Import authentication context provider

// AuthProvider component: Wraps the application with authentication context
export default function AuthProvider({
  children, // Represents all components inside this provider
}: { children: React.ReactNode }) {

  return (
    <SessionProvider> 
      {children} // Makes authentication session available to all child components
    </SessionProvider>
  )
}
