import type { Metadata } from "next";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import ChunkErrorListener from '@/components/ChunkErrorListener'; // Import it

export const metadata: Metadata = {
  title: "Room Chat",
  description: "Neobrutalist Chat App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <ChunkErrorListener /> {/* <--- ADD THIS LINE */}
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}