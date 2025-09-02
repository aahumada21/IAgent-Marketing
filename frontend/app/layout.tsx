import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "AI Ads",
  description: "Generador de contenido publicitario con IA"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
