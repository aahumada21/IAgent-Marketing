import "./globals.css";
import Navbar from "@/components/Navbar";
import AppHeader from "@/components/AppHeader";

export const metadata = {
  title: "AI Ads",
  description: "Generador de contenido publicitario con IA"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
    <body>
        {/* Header global con saldo y estado de Supabase */}
        <AppHeader />
        <div className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
