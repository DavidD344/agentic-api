"use client";

import { mainApi } from "@/api-queries/mainApi";
import { Body } from "@/ds/typography/Body/Body";
import { H2 } from "@/ds/typography/H2/H2";
import { cn } from "@/ds/utils/cnMerge";
import { useEffect, useMemo, useState } from "react";

interface ProfileSemantic {
  institution_state_uf?: string;
  institution_region?: string;
  scholarship_category?: string;
  doctorate_year?: number;
  years_since_doctorate?: number;
  sex_inferred?: string;
  main_research_area?: string;
  research_topics?: string[];
  dashboard_tags?: string[];
  profile_summary_short?: string;
}

interface ProfileItem {
  name?: string;
  institution?: string;
  scholarship_level?: string;
  lattes_code?: string;
  public_lattes_id?: string;
  lattes_url?: string;
  photo_url?: string;
  needs_review: boolean;
  semantic: ProfileSemantic;
}

interface ProfilesResponse {
  total: number;
  limit: number;
  offset: number;
  items: ProfileItem[];
}

interface ProfileFilters {
  q: string;
  institution: string;
  scholarship_level: string;
  sex: string;
  region: string;
}

const pageSize = 24;

const formatLabel = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "Nao informado";

  return String(value)
    .replaceAll("_", " ")
    .replace(/^male$/, "Homem")
    .replace(/^female$/, "Mulher")
    .replace(/^unknown$/, "Nao informado");
};

const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const filterOptions = {
  scholarship_level: ["", "PQ-SR", "PQ-A", "PQ-B", "PQ-C", "PQ-1A", "PQ-1B", "PQ-1C", "PQ-1D", "PQ-2"],
  sex: ["", "male", "female"],
  region: ["", "Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"],
};

function ProfilePhoto({ profile }: { profile: ProfileItem }) {
  const [failed, setFailed] = useState(false);

  if (!profile.photo_url || failed) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-[#EFF8FF] text-[1.8rem] font-semibold text-[#175CD3]">
        {initials(profile.name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={profile.name || "Foto do perfil"}
      className="h-20 w-20 shrink-0 rounded-md object-cover"
      onError={() => setFailed(true)}
      src={profile.photo_url}
    />
  );
}

function ProfileCard({ profile }: { profile: ProfileItem }) {
  const topics = Array.isArray(profile.semantic.research_topics)
    ? profile.semantic.research_topics.slice(0, 4)
    : [];
  const tags = Array.isArray(profile.semantic.dashboard_tags)
    ? profile.semantic.dashboard_tags.slice(0, 3)
    : [];
  const visibleTerms = Array.from(new Set([...topics, ...tags]));

  return (
    <article className="rounded-lg border border-[#E3E6EA] bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <ProfilePhoto profile={profile} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-[1.65rem] font-semibold leading-tight text-[#111827]">
                {profile.name || "Nome nao informado"}
              </h3>
              <Body className="mt-1 text-[1.25rem] text-[#667085]" weight="Regular">
                {profile.institution || "Instituicao nao informada"} ·{" "}
                {profile.semantic.institution_state_uf || "UF nao informada"} ·{" "}
                {profile.semantic.institution_region || "Regiao nao informada"}
              </Body>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <span className="rounded-md bg-[#EFF8FF] px-2.5 py-1 text-[1.15rem] font-semibold text-[#175CD3]">
                {profile.scholarship_level || "Bolsa nao informada"}
              </span>
              <span className="rounded-md bg-[#ECFDF3] px-2.5 py-1 text-[1.15rem] font-semibold text-[#027A48]">
                {formatLabel(profile.semantic.sex_inferred)}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-2 text-[1.2rem] text-[#475467] md:grid-cols-2">
            <div>
              <span className="font-semibold text-[#344054]">Area: </span>
              {formatLabel(profile.semantic.main_research_area)}
            </div>
            <div>
              <span className="font-semibold text-[#344054]">Doutorado: </span>
              {profile.semantic.doctorate_year || "Nao informado"}
            </div>
          </div>

          {profile.semantic.profile_summary_short && (
            <Body className="mt-3 line-clamp-3 text-[1.25rem] text-[#475467]" weight="Regular">
              {profile.semantic.profile_summary_short}
            </Body>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {visibleTerms.map((topic) => (
              <span
                key={topic}
                className="rounded-md border border-[#E3E6EA] bg-[#F8FAFC] px-2 py-1 text-[1.1rem] text-[#475467]"
              >
                {formatLabel(topic)}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Body className="text-[1.15rem] text-[#98A2B3]" weight="Regular">
              {profile.lattes_code || profile.public_lattes_id || "ID Lattes nao informado"}
            </Body>
            {profile.lattes_url && (
              <a
                className="rounded-md border border-[#D0D5DD] px-3 py-2 text-[1.2rem] font-semibold text-[#344054] hover:border-[#98A2B3]"
                href={profile.lattes_url}
                rel="noreferrer"
                target="_blank"
              >
                Abrir Lattes
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProfilesScreen() {
  const [filters, setFilters] = useState<ProfileFilters>({
    q: "",
    institution: "",
    scholarship_level: "",
    sex: "",
    region: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<ProfilesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  const params = useMemo(() => {
    const clean: Record<string, string | number> = {
      limit: pageSize,
      offset,
    };

    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value) clean[key] = value;
    });

    return clean;
  }, [appliedFilters, offset]);

  useEffect(() => {
    let active = true;

    async function loadProfiles() {
      try {
        setLoading(true);
        const response = await mainApi.get<ProfilesResponse>("/profiles", { params });

        if (active) {
          setData(response.data);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Nao foi possivel carregar os perfis.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfiles();

    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOffset(0);
      setAppliedFilters(filters);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  function clearFilters() {
    const empty = {
      q: "",
      institution: "",
      scholarship_level: "",
      sex: "",
      region: "",
    };
    setFilters(empty);
    setAppliedFilters(empty);
    setOffset(0);
  }

  const paginationControls = (
    <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <Body className="text-[1.25rem] text-[#667085]" weight="Regular">
        Pagina {currentPage} de {totalPages}
      </Body>
      <div className="flex gap-2">
        <button
          className={cn(
            "h-10 rounded-md border px-4 text-[1.25rem] font-semibold",
            offset <= 0
              ? "cursor-not-allowed border-[#E3E6EA] text-[#98A2B3]"
              : "border-[#D0D5DD] text-[#344054] hover:border-[#98A2B3]"
          )}
          disabled={offset <= 0}
          onClick={() => setOffset((prev) => Math.max(0, prev - pageSize))}
          type="button"
        >
          Anterior
        </button>
        <button
          className={cn(
            "h-10 rounded-md border px-4 text-[1.25rem] font-semibold",
            !data || offset + pageSize >= data.total
              ? "cursor-not-allowed border-[#E3E6EA] text-[#98A2B3]"
              : "border-[#D0D5DD] text-[#344054] hover:border-[#98A2B3]"
          )}
          disabled={!data || offset + pageSize >= data.total}
          onClick={() => setOffset((prev) => prev + pageSize)}
          type="button"
        >
          Proxima
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-[132rem]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <H2 className="text-[2.8rem] text-[#111827]" weight="SemiBold">
              Pesquisadores
            </H2>
            <Body className="mt-2 max-w-[76rem] text-[1.4rem] text-[#667085]" weight="Regular">
              Listagem dos bolsistas com dados de Lattes, instituicao, bolsa e inferencias usadas
              no dashboard.
            </Body>
          </div>
          <Body className="text-[1.25rem] text-[#667085]" weight="Regular">
            {data ? `${data.total} perfil(is)` : "Carregando perfis"}
          </Body>
        </div>

        <section className="mt-6 rounded-lg border border-[#E3E6EA] bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_16rem_16rem_16rem_auto]">
            <input
              className="h-11 rounded-md border border-[#D0D5DD] px-3 text-[1.3rem] text-[#111827] outline-none focus:border-[#2E90FA]"
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Buscar por nome, area, topico..."
              value={filters.q}
            />
            <input
              className="h-11 rounded-md border border-[#D0D5DD] px-3 text-[1.3rem] text-[#111827] outline-none focus:border-[#2E90FA]"
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, institution: event.target.value }))
              }
              placeholder="Instituicao"
              value={filters.institution}
            />
            <select
              className="h-11 rounded-md border border-[#D0D5DD] px-3 text-[1.3rem] text-[#111827] outline-none focus:border-[#2E90FA]"
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, scholarship_level: event.target.value }))
              }
              value={filters.scholarship_level}
            >
              {filterOptions.scholarship_level.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "Todas as bolsas"}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-md border border-[#D0D5DD] px-3 text-[1.3rem] text-[#111827] outline-none focus:border-[#2E90FA]"
              onChange={(event) => setFilters((prev) => ({ ...prev, sex: event.target.value }))}
              value={filters.sex}
            >
              {filterOptions.sex.map((option) => (
                <option key={option || "all"} value={option}>
                  {option ? formatLabel(option) : "Todos os sexos"}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-md border border-[#D0D5DD] px-3 text-[1.3rem] text-[#111827] outline-none focus:border-[#2E90FA]"
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, region: event.target.value }))
              }
              value={filters.region}
            >
              {filterOptions.region.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "Todas as regioes"}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                className="h-11 rounded-md border border-[#D0D5DD] px-4 text-[1.25rem] font-semibold text-[#344054] hover:border-[#98A2B3]"
                onClick={clearFilters}
                type="button"
              >
                Limpar
              </button>
            </div>
          </div>
        </section>

        {error && (
          <section className="mt-6 rounded-lg border border-[#FDA29B] bg-white p-5">
            <Body className="text-[1.35rem] text-[#B42318]" weight="Medium">
              {error}
            </Body>
          </section>
        )}

        {paginationControls}

        {loading ? (
          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-lg bg-white" />
            ))}
          </section>
        ) : (
          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            {(data?.items || []).map((profile) => (
              <ProfileCard
                key={profile.lattes_code || profile.public_lattes_id || profile.name}
                profile={profile}
              />
            ))}
          </section>
        )}

        {!loading && data?.items.length === 0 && (
          <section className="mt-6 rounded-lg border border-[#E3E6EA] bg-white p-8 text-center">
            <Body className="text-[1.4rem] text-[#667085]" weight="Regular">
              Nenhum perfil encontrado para os filtros selecionados.
            </Body>
          </section>
        )}
      </div>
    </main>
  );
}
