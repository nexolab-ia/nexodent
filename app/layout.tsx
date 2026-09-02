import type {Metadata,Viewport} from "next";
import type {ReactNode} from "react";
import "./globals.css";
import {ServiceWorkerRegistration} from "@/components/pwa/service-worker-registration";

const themeInit = `(function(){try{var k="nexodent-theme",t;try{t=localStorage.getItem(k)}catch(e){}if(t!=="light"&&t!=="dark"){t="dark"}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();`;

export const metadata:Metadata={
  title:{default:"NexoDent",template:"%s · NexoDent"},
  description:"Gestión dental clara, segura y diseñada para clínicas chilenas.",
  manifest:"/manifest.webmanifest",
  appleWebApp:{capable:true,title:"NexoDent",statusBarStyle:"black-translucent"},
  icons:[{rel:"icon",url:"/icons/icon.svg",type:"image/svg+xml"}],
};

export const viewport:Viewport={
  width:"device-width",
  initialScale:1,
  themeColor:"#0b1120",
  colorScheme:"dark",
};

export default function RootLayout({children}:Readonly<{children:ReactNode}>){
  return (
    <html lang="es-CL" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:themeInit}} />
      </head>
      <body><ServiceWorkerRegistration/>{children}</body>
    </html>
  );
}