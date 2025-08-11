import "./globals.css";
import Backdrop from "./components/Backdrop";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Luke Pritchard — Portfolio",
  description: "Propulsion and Test Engineering projects",
  openGraph: {
    title: "Luke Pritchard — Portfolio",
    description: "Propulsion and Test Engineering projects"
  },
  icons: {
    icon: "/favicon/favicon.ico"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Backdrop />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
