import type { Metadata } from "next";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';

export const metadata: Metadata = {
  title: "Room Chat",
  description: "Neobrutalist Chat App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // REPLACE THIS WITH YOUR ACTUAL GOOGLE CLIENT ID
  const GOOGLE_CLIENT_ID = "330254000032-a44jgat9dsffraenoa0fuucqa5tv6lo7.apps.googleusercontent.com";

  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}