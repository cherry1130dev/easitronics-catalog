import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GeminiChatbot from "@/components/GeminiChatbot";

export const metadata: Metadata = {
  title: "EasiCart powered by Easitronics | Engineering Project Catalog & Electronics Store",
  description: "EasiCart powered by Easitronics - Your ultimate partner for engineering projects, electronics components, and expert assistance for students.",
  icons: {
    icon: "/logo.jpg",
  },
  openGraph: {
    title: "EasiCart powered by Easitronics - Engineering Projects & Electronics Store",
    description: "EasiCart powered by Easitronics - Your ultimate partner for engineering projects, electronics components, and expert assistance for students.",
    images: ["/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                function isExtensionError(err, msg, file) {
                  var str = (file || '') + ' ' + (msg || '') + ' ' + (err && err.stack ? err.stack : '');
                  return str.indexOf('chrome-extension://') !== -1 || 
                         str.indexOf('Minified React error #299') !== -1 || 
                         str.indexOf('invariant=299') !== -1 ||
                         str.indexOf('embed_script.js') !== -1;
                }
                var origOnError = window.onerror;
                window.onerror = function(msg, url, line, col, error) {
                  if (isExtensionError(error, msg, url)) {
                    return true;
                  }
                  if (origOnError) return origOnError.apply(this, arguments);
                };
                window.addEventListener('error', function(e) {
                  if (isExtensionError(e.error, e.message, e.filename)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  var r = e.reason;
                  var str = r ? (r.stack || r.message || String(r)) : '';
                  if (str.indexOf('chrome-extension://') !== -1 || str.indexOf('invariant=299') !== -1) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
                var origConsoleError = console.error;
                console.error = function() {
                  var text = Array.prototype.slice.call(arguments).map(function(item) {
                    return item && item.stack ? item.stack : String(item);
                  }).join(' ');
                  if (text.indexOf('chrome-extension://') !== -1 || text.indexOf('invariant=299') !== -1 || text.indexOf('Minified React error #299') !== -1) {
                    return;
                  }
                  origConsoleError.apply(console, arguments);
                };
              })();
            `,
          }}
        />
      </head>
      <body 
        className="bg-[#eaeded] text-slate-900 min-h-screen flex flex-col antialiased selection:bg-amber-400 selection:text-slate-950" 
        suppressHydrationWarning
      >
        <Navbar />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
        <GeminiChatbot />
      </body>
    </html>
  );
}
