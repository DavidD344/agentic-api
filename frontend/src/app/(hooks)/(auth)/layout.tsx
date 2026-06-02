"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/stores/auth/useSession";
import { BarLoading } from "@/ds/animations/barLoading/BarLoading";
import Link from "next/link";
import { cn } from "@/ds/utils/cnMerge";
import { DropdownRoot } from "@/ds/components/dropdown/Root/DropdownRoot";
import { Body } from "@/ds/typography/Body/Body";
import { getInitials } from "@/helpers/getInitials/getInitials";

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { token, userData, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [modalActive, setModalActive] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profiles", label: "Pesquisadores" },
    { href: "/chat", label: "Chat" },
  ];

  // ★ 1) flag para saber quando já rodamos o useEffect de mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ★ 2) só redireciona depois que montou de verdade
  useEffect(() => {
    if (!mounted) return;       // não faz nada no primeiro render
    if (!token) {
      router.replace("/login"); // se não tiver token, manda pro login
    }
  }, [mounted, token, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalContainerRef.current &&
        !modalContainerRef.current.contains(event.target as Node) &&
        modalActive
      ) {
        setModalActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalActive]);

  // ★ 3) enquanto não estiver “montado” ou não tiver token, mostra o loader
  if (!mounted || !token) {
    return (
      <div className="flex items-center justify-center h-full">
        <BarLoading className="top-0" />
      </div>
    );
  }

  // ★ 4) quando montado e com token, libera o conteúdo
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-40 border-b border-[#E3E6EA] bg-white/95 px-6 py-3 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-[132rem] flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link href="/dashboard" className="text-[1.55rem] font-semibold text-[#111827]">
            Agentic Scraper
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {links.map((link) => {
                const active =
                  pathname === link.href || (link.href === "/chat" && pathname.startsWith("/chat/"));

                return (
                  <Link
                    key={link.href}
                    className={cn(
                      "rounded-md border px-3 py-2 text-[1.25rem] font-semibold transition",
                      active
                        ? "border-[#2E90FA] bg-[#EFF8FF] text-[#175CD3]"
                        : "border-[#D0D5DD] bg-white text-[#475467] hover:border-[#98A2B3]"
                    )}
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <DropdownRoot
              ref={modalContainerRef}
              active={modalActive}
              boxClassname="mt-[1rem]"
              buttonDrop={
                <button
                  aria-label="Abrir menu da conta"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004EEC] text-white transition hover:bg-[#003BB3]"
                  onClick={() => setModalActive((prev) => !prev)}
                  type="button"
                >
                  <Body className="text-center text-[1.2rem] text-white" weight="Medium">
                    {getInitials({ stringNames: userData?.name || userData?.email || "AD" })}
                  </Body>
                </button>
              }
            >
              <div className="px-4 py-2">
                <Body className="text-[#1D1D1D]" weight="Medium">
                  Conta
                </Body>

                <div className="mt-4 flex flex-row items-center gap-4">
                  <div className="flex h-[3.6rem] w-[3.6rem] cursor-default items-center justify-center rounded-full bg-[#004EEC]">
                    <Body className="text-center text-[1.4rem] text-white" weight="Medium">
                      {getInitials({ stringNames: userData?.name || userData?.email || "AD" })}
                    </Body>
                  </div>
                  <div className="min-w-0">
                    <Body className="truncate text-[1.4rem] text-[#1D1D1D]" weight="Bold">
                      {userData?.name || "Administrador"}
                    </Body>
                    <Body className="truncate text-[#1D1D1D]" weight="Regular">
                      {userData?.email || "admin@admin.com"}
                    </Body>
                  </div>
                </div>
                <div className="my-4 h-px w-full bg-[#E4E4E4]" />
                <button
                  className="text-[1.4rem] text-[#0077B6] transition hover:font-semibold"
                  onClick={() => {
                    setModalActive(false);
                    signOut();
                  }}
                  type="button"
                >
                  Sair
                </button>
              </div>
            </DropdownRoot>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
