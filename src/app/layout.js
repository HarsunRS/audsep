import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "AudSep | AI Audio Separation",
  description: "Next-generation AI audio separation. Split vocals, drums, bass, and more from any track in seconds.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
