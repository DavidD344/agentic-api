"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { Body } from "@/ds/typography/Body/Body";

interface AuthLayoutModalProps {
  children?: React.ReactNode;
}

const AuthLayoutModal = forwardRef<HTMLDivElement, AuthLayoutModalProps>(
  ({ children }, ref) => {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-6 py-10 md:px-10">
        <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[108rem] flex-col items-center justify-center">
          <div className="mb-8 w-full max-w-[64.5rem]">
            <Link href="/" className="text-[1.55rem] font-semibold text-[#111827]">
              Agentic Scraper
            </Link>
            <Body className="mt-2 text-[1.3rem] text-[#667085]" weight="Regular">
              Acesse a ferramenta para consultar dashboard, pesquisadores e chat analitico.
            </Body>
          </div>
          <div ref={ref} className="w-full max-w-[64.5rem] rounded-lg border border-[#E3E6EA] bg-white p-6 shadow-sm md:p-8">
            {children}
          </div>
        </section>
      </main>
    );
  }
);

AuthLayoutModal.displayName = "AuthLayoutModal";

export { AuthLayoutModal };
