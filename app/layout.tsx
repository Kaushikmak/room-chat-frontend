import type { Metadata } from "next";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/context/AuthContext'; // Import Context
import ChunkErrorListener from '@/components/ChunkErrorListener'; // Safety Script

export const metadata: Metadata = {
  title: "Room Chat",
  description: "Neobrutalist Chat App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use environment variable or fallback
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_ID_HERE";

  return (
    <html lang="en">
      <body>
        <ChunkErrorListener />
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {/* Wrap entire app in AuthProvider */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}