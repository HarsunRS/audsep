import { ClerkProvider } from '@clerk/nextjs';
import { PostHogProvider, PostHogUserIdentifier } from '../components/PostHogProvider';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'AudSep — AI Audio Stem Separator',
  description: 'Separate any track into vocals, drums, bass, and instruments with studio-grade AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ClerkProvider>
          <PostHogProvider>
            <PostHogUserIdentifier />
            <Navbar />
            {children}
          </PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
