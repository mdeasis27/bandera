import type { Metadata } from "next";
import { fontVariables } from "@/design-system/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bandera · AI feature flags con gradual rollout",
  description:
    "Feature flags para features de IA: rollout gradual que solo avanza cuando la variante es estadísticamente no-peor, con kill-switch. Simulación determinista + Welch t-test. Sin API keys.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider defaultTheme="dark" enableSystem={false} attribute="class">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
