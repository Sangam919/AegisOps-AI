import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "AegisOps AI — Autonomous AI Operations & Reliability Platform",
  description:
    "Enterprise-grade autonomous site reliability platform combining ML anomaly detection, multi-agent AI incident investigation, RAG runbook retrieval, and safe remediation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07090e] text-slate-100 min-h-screen">
        <Sidebar />
        <Navbar />
        <main className="pl-64 pt-16 min-h-screen bg-[#07090e] overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
