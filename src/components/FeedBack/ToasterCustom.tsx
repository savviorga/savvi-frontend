"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterCustom() {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={12}
      containerStyle={{
        bottom: 20,
        right: 20,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "5px",
          padding: "16px",
          fontSize: "14px",
          maxWidth: "400px",
        },
        success: {
          style: {
            background: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
          },
          iconTheme: {
            primary: "#10b981",
            secondary: "#fff",
          },
        },
        error: {
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
        loading: {
          style: {
            background: "#f0f9ff",
            color: "#075985",
            border: "1px solid #bae6fd",
          },
        },
      }}
    />
  );
}
