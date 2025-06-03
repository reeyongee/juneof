"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#F8F4EC] group-[.toaster]:text-[#171717] group-[.toaster]:border-[#171717] group-[.toaster]:shadow-lg group-[.toaster]:font-serif group-[.toaster]:rounded-none",
          description:
            "group-[.toast]:text-[#171717]/70 group-[.toast]:lowercase group-[.toast]:tracking-wider group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-[#171717] group-[.toast]:text-[#F8F4EC] group-[.toast]:lowercase group-[.toast]:tracking-widest group-[.toast]:rounded-none",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-[#171717] group-[.toast]:border group-[.toast]:border-[#171717] group-[.toast]:lowercase group-[.toast]:tracking-widest group-[.toast]:rounded-none",
          title:
            "group-[.toast]:text-[#171717] group-[.toast]:lowercase group-[.toast]:tracking-widest group-[.toast]:font-serif",
          success:
            "group-[.toast]:border-[#171717] group-[.toast]:bg-[#F8F4EC] group-[.toast]:rounded-none",
          error:
            "group-[.toast]:border-red-600 group-[.toast]:bg-[#F8F4EC] group-[.toast]:rounded-none",
          info: "group-[.toast]:border-[#171717] group-[.toast]:bg-[#F8F4EC] group-[.toast]:rounded-none",
          warning:
            "group-[.toast]:border-orange-600 group-[.toast]:bg-[#F8F4EC] group-[.toast]:rounded-none",
        },
      }}
      style={
        {
          "--normal-bg": "#F8F4EC",
          "--normal-text": "#171717",
          "--normal-border": "#171717",
          "--success-bg": "#F8F4EC",
          "--success-text": "#171717",
          "--success-border": "#171717",
          "--error-bg": "#F8F4EC",
          "--error-text": "#171717",
          "--error-border": "#dc2626",
          "--info-bg": "#F8F4EC",
          "--info-text": "#171717",
          "--info-border": "#171717",
          "--warning-bg": "#F8F4EC",
          "--warning-text": "#171717",
          "--warning-border": "#ea580c",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
