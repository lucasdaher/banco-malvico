"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { Toaster } from "sonner";

export default function FuncionarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <>
      <Sidebar
        isExpanded={isSidebarExpanded}
        toggleSidebar={toggleSidebar}
        isEmployee
      />
      <main
        className={`p-8 transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        {children}
      </main>
      <Toaster richColors position="top-right" />{" "}
    </>
  );
}
