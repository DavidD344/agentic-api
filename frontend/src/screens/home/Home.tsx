"use client";

import Link from "next/link";
import { Body } from "@/ds/typography/Body/Body";
import { H1 } from "@/ds/typography/H1/H1";

const HomeScreen = () => {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-10 md:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[108rem] flex-col justify-center">
        <div className="max-w-[76rem]">
          <Body className="mb-3 text-[1.35rem] font-semibold text-[#175CD3]" weight="SemiBold">
            Sistema multiagente de consulta e visualizacao de bolsistas CNPq
          </Body>
          <H1 className="text-[4rem] leading-tight text-[#111827] md:text-[5.4rem]" weight="SemiBold">
            Agentic Scraper
          </H1>
          <Body className="mt-5 text-[1.55rem] leading-8 text-[#475467]" weight="Regular">
            Ferramenta para coletar dados públicos de bolsistas PQ em Ciencia da Computacao,
            enriquecer com informacoes do Curriculo Lattes, gerar metricas para dashboard e
            responder perguntas em linguagem natural sobre pesquisadores, instituicoes,
            areas, bolsas e distribuicoes.
          </Body>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-[#175CD3] px-5 py-3 text-[1.35rem] font-semibold text-white transition hover:bg-[#1849A9]"
              href="/dashboard"
            >
              Abrir dashboard
            </Link>
            <Link
              className="rounded-md border border-[#D0D5DD] bg-white px-5 py-3 text-[1.35rem] font-semibold text-[#344054] transition hover:border-[#98A2B3]"
              href="/login"
            >
              Ir para login
            </Link>
          </div>
          <Body className="mt-5 text-[1.25rem] text-[#667085]" weight="Regular">
            Login de demonstracao: admin@admin.com / admin
          </Body>
        </div>
      </section>
    </main>
  );
};

export { HomeScreen };
