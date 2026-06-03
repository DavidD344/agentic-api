"use client";

import { mainApi } from "@/api-queries/mainApi";
import { Body } from "@/ds/typography/Body/Body";
import { H2 } from "@/ds/typography/H2/H2";
import { useEffect, useState } from "react";

interface PipelineStatus {
  running: boolean;
  status: string;
  pid?: number;
  started_at?: string;
  limit?: number;
  log_path?: string;
  latest_pipeline_summary_json?: string;
  log_tail?: string[];
}

interface PipelineRun {
  run_id: string;
  pipeline_run_dir: string;
  summary_json: string;
  log_path?: string;
  limit?: number;
  promoted?: boolean;
  validation_ok?: boolean;
  validation_reasons: string[];
  cnpq_run_dir?: string;
  preview_run_dir?: string;
  full_run_dir?: string;
  inference_run_dir?: string;
  profiles_with_inferences_json?: string;
  is_current: boolean;
}

interface PipelineHistory {
  current: {
    run_id?: string;
    pipeline_run_dir?: string;
    updated_at?: string;
    profiles_with_inferences_json?: string;
    summary_json?: string;
    log_path?: string;
  };
  runs: PipelineRun[];
}

const formatValue = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "Nao informado";
  return String(value);
};

const formatRunDate = (runId?: string) => {
  if (!runId) return "Nao informado";

  const match = runId.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/);

  if (!match) return runId;

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

export function SettingsScreen() {
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [pipelineHistory, setPipelineHistory] = useState<PipelineHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPipelineStatus() {
      try {
        setLoading(true);
        const [statusResponse, historyResponse] = await Promise.all([
          mainApi.get<PipelineStatus>("/admin/pipeline/status"),
          mainApi.get<PipelineHistory>("/admin/pipeline/history"),
        ]);

        if (active) {
          setPipelineStatus(statusResponse.data);
          setPipelineHistory(historyResponse.data);
        }
      } catch {
        if (active) {
          setPipelineStatus(null);
          setPipelineHistory(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPipelineStatus();

    return () => {
      active = false;
    };
  }, []);

  async function exportProfilesCsv() {
    try {
      setExporting(true);
      const response = await mainApi.get<Blob>("/profiles/export.csv", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = `agentic-api-perfis-${pipelineHistory?.current.run_id || "atual"}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-[132rem]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <H2 className="text-[2.8rem] text-[#111827]" weight="SemiBold">
              Configurações
            </H2>
          </div>
        </div>

        <section className="mt-6 rounded-lg border border-[#E3E6EA] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-[1.7rem] font-semibold text-[#111827]">
                Pipeline
              </h3>
              <Body className="mt-1 text-[1.25rem] text-[#667085]" weight="Regular">
                {pipelineStatus?.running ? "Rodando agora" : "Parada"}
              </Body>
            </div>
            <button
              className="h-11 cursor-not-allowed rounded-md border border-[#FDA29B] bg-[#FEF3F2] px-4 text-[1.25rem] font-semibold text-[#B42318] opacity-70"
              disabled
              title="Bloqueado no frontend para evitar execucao acidental"
              type="button"
            >
              Rodar pipeline
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-[#E3E6EA] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-[1.7rem] font-semibold text-[#111827]">
                Exportar base
              </h3>
              <Body className="mt-1 text-[1.25rem] text-[#667085]" weight="Regular">
                CSV com os perfis e campos inferidos da base atual.
              </Body>
            </div>
            <button
              className="h-11 rounded-md border border-[#D0D5DD] bg-white px-4 text-[1.25rem] font-semibold text-[#344054] hover:border-[#98A2B3] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={exporting}
              onClick={exportProfilesCsv}
              type="button"
            >
              {exporting ? "Exportando..." : "Baixar CSV"}
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-[#E3E6EA] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-[1.7rem] font-semibold text-[#111827]">
                Base atual
              </h3>
              <div className="mt-2 flex flex-wrap gap-2 text-[1.2rem]">
                <span className="rounded-md bg-[#ECFDF3] px-2.5 py-1 font-semibold text-[#027A48]">
                  {formatValue(pipelineHistory?.current.run_id)}
                </span>
                <span className="rounded-md border border-[#E3E6EA] px-2.5 py-1 text-[#475467]">
                  {formatRunDate(pipelineHistory?.current.run_id)}
                </span>
              </div>
            </div>
            <div className="max-w-full truncate text-[1.2rem] text-[#667085] md:max-w-[54rem]">
              {formatValue(pipelineHistory?.current.pipeline_run_dir)}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-[#E3E6EA] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-[1.7rem] font-semibold text-[#111827]">
                Histórico de execuções
              </h3>
            </div>
            <Body className="text-[1.2rem] text-[#667085]" weight="Regular">
              {pipelineHistory ? `${pipelineHistory.runs.length} execução(ões)` : "Carregando"}
            </Body>
          </div>

          <div className="mt-4 overflow-hidden rounded-md border border-[#E3E6EA]">
            <div className="hidden grid-cols-[16rem_18rem_10rem_10rem] bg-[#F8FAFC] px-4 py-3 text-[1.15rem] font-semibold text-[#344054] md:grid">
              <div>Execução</div>
              <div>Data</div>
              <div>Atual</div>
              <div>Validação</div>
            </div>
            {(pipelineHistory?.runs || []).map((run) => (
              <div
                key={run.run_id}
                className="grid gap-2 border-t border-[#E3E6EA] px-4 py-3 text-[1.2rem] text-[#475467] md:grid-cols-[16rem_18rem_10rem_10rem] md:items-center"
              >
                <div className="font-semibold text-[#111827]">{run.run_id}</div>
                <div>{formatRunDate(run.run_id)}</div>
                <div>
                  {run.is_current ? (
                    <span className="rounded-md bg-[#ECFDF3] px-2 py-1 text-[1.1rem] font-semibold text-[#027A48]">
                      Atual
                    </span>
                  ) : (
                    <span className="text-[#98A2B3]">-</span>
                  )}
                </div>
                <div>{run.validation_ok ? "OK" : "Pendente"}</div>
              </div>
            ))}
            {!loading && pipelineHistory?.runs.length === 0 && (
              <div className="border-t border-[#E3E6EA] px-4 py-6 text-center text-[1.25rem] text-[#667085]">
                Nenhuma execução encontrada.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
