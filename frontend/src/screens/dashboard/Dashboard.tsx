"use client";

import { mainApi } from "@/api-queries/mainApi";
import { Body } from "@/ds/typography/Body/Body";
import { H2 } from "@/ds/typography/H2/H2";
import { cn } from "@/ds/utils/cnMerge";
import { useEffect, useState } from "react";

interface CountItem {
  label: string;
  count: number;
}

interface CrossChartRow {
  label: string;
  total: number;
  values: Record<string, number>;
}

interface DashboardMetrics {
  dataset: {
    total_profiles: number;
    profiles_with_review_flags: number;
    review_rate: number;
  };
  quality: {
    llm_errors: number | null;
    llm_repair_attempts: number | null;
    llm_repair_successes: number | null;
  };
  distributions: {
    scholarship_levels: CountItem[];
    scholarship_categories: CountItem[];
    institutions: CountItem[];
    institution_ufs: CountItem[];
    institution_regions: CountItem[];
    sex: CountItem[];
    main_research_areas: CountItem[];
    career_stages: CountItem[];
    seniority: CountItem[];
    doctorate_years: {
      buckets: Record<string, number>;
      min: number | null;
      max: number | null;
    };
  };
  experience_flags: Record<string, Record<string, number>>;
  top_terms: {
    research_topics: CountItem[];
    methods_and_techniques: CountItem[];
    application_domains: CountItem[];
    dashboard_tags: CountItem[];
  };
  analysis: {
    recommended_cards: {
      institutions_count: number;
      ufs_count: number;
      main_areas_count: number;
      llm_errors: number | null;
    };
    cross_charts: {
      area_by_scholarship_category: CrossChartRow[];
      area_by_scholarship_level: CrossChartRow[];
      institution_by_sex: CrossChartRow[];
      state_by_sex: CrossChartRow[];
      sex_by_scholarship_category: CrossChartRow[];
      sex_by_scholarship_level: CrossChartRow[];
      scholarship_category_by_doctorate_age: CrossChartRow[];
      scholarship_level_by_doctorate_age: CrossChartRow[];
      region_by_scholarship_category: CrossChartRow[];
      region_by_scholarship_level: CrossChartRow[];
    };
  };
}

const percent = (value: number, total: number) => {
  if (!total) return 0;

  return Math.round((value / total) * 1000) / 10;
};

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/^true$/, "Sim")
    .replace(/^false$/, "Não")
    .replace(/^male$/, "Homem")
    .replace(/^female$/, "Mulher")
    .replace(/^unknown$/, "Não informado");

const sortItems = (items: CountItem[] = []) =>
  [...items].sort((a, b) => b.count - a.count);

const scholarshipDifficultyOrder = [
  "PQ-SR",
  "PQ-A",
  "PQ-B",
  "PQ-C",
  "PQ-1A",
  "PQ-1B",
  "PQ-1C",
  "PQ-1D",
  "PQ-2",
];

const doctorateBucketOrder = [
  "before_1990",
  "1990_1999",
  "2000_2009",
  "2010_2019",
  "2020_plus",
  "unknown",
];

const doctorateBucketLabels: Record<string, string> = {
  "0_4": "0-4 anos",
  "5_9": "5-9 anos",
  "10_19": "10-19 anos",
  "20_29": "20-29 anos",
  "30_plus": "30+ anos",
  before_1990: "Até 1990",
  "1990_1999": "1990-1999",
  "2000_2009": "2000-2009",
  "2010_2019": "2010-2019",
  "2020_plus": "2020+",
  unknown: "Sem ano",
};

const sortItemsByOrder = (items: CountItem[] = [], order: string[]) => {
  const orderMap = new Map(order.map((label, index) => [label, index]));

  return [...items].sort((a, b) => {
    const aIndex = orderMap.get(a.label) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderMap.get(b.label) ?? Number.MAX_SAFE_INTEGER;

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return b.count - a.count;
  });
};

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-[#E3E6EA] bg-white px-5 py-4 shadow-sm">
      <Body className="text-[1.2rem] uppercase tracking-wide text-[#667085]" weight="Medium">
        {label}
      </Body>
      <div className="mt-2 text-[2.8rem] font-semibold leading-none text-[#111827]">
        {value}
      </div>
      {detail && (
        <Body className="mt-2 text-[1.3rem] text-[#667085]" weight="Regular">
          {detail}
        </Body>
      )}
    </div>
  );
}

function SexDonutCard({
  items,
  total,
}: {
  items: CountItem[];
  total: number;
}) {
  const colors: Record<string, string> = {
    male: "#2E90FA",
    female: "#12B76A",
    unknown: "#98A2B3",
  };
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="rounded-lg border border-[#E3E6EA] bg-white px-5 py-4 shadow-sm">
      <Body className="text-[1.2rem] uppercase tracking-wide text-[#667085]" weight="Medium">
        Sexo inferido
      </Body>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[8.4rem] w-[8.4rem] shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 72 72" role="img">
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="transparent"
              stroke="#EEF2F6"
              strokeWidth="10"
            />
            {items.map((item) => {
              const length = total ? (item.count / total) * circumference : 0;
              const segment = (
                <circle
                  key={item.label}
                  cx="36"
                  cy="36"
                  r={radius}
                  fill="transparent"
                  stroke={colors[item.label] || "#7A5AF8"}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  strokeWidth="10"
                />
              );
              offset += length;

              return segment;
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[1.45rem] font-semibold text-[#111827]">
            {total}
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[item.label] || "#7A5AF8" }}
                />
                <Body className="truncate text-[1.2rem] text-[#344054]" weight="Medium">
                  {formatLabel(item.label)}
                </Body>
              </div>
              <Body className="shrink-0 text-[1.15rem] text-[#667085]" weight="Regular">
                {percent(item.count, total)}%
              </Body>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarList({
  title,
  items,
  total,
  limit = 8,
  tone = "default",
  sortOrder,
}: {
  title: string;
  items: CountItem[];
  total?: number;
  limit?: number;
  tone?: "default" | "green" | "blue";
  sortOrder?: string[];
}) {
  const visible = (sortOrder ? sortItemsByOrder(items, sortOrder) : sortItems(items)).slice(0, limit);
  const max = Math.max(...visible.map((item) => item.count), 1);
  const color =
    tone === "green" ? "bg-[#12B76A]" : tone === "blue" ? "bg-[#2E90FA]" : "bg-[#475467]";

  return (
    <section className="rounded-lg border border-[#E3E6EA] bg-white p-5 shadow-sm">
      <H2 className="text-[1.7rem] text-[#111827]" weight="SemiBold">
        {title}
      </H2>
      <div className="mt-4 space-y-3">
        {visible.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-4">
              <Body className="truncate text-[1.35rem] text-[#344054]" weight="Medium">
                {formatLabel(item.label)}
              </Body>
              <Body className="shrink-0 text-[1.25rem] text-[#667085]" weight="Regular">
                {item.count}
                {total ? ` (${percent(item.count, total)}%)` : ""}
              </Body>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2F6]">
              <div
                className={cn("h-full rounded-full", color)}
                style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LineChart({
  title,
  items,
  note,
}: {
  title: string;
  items: CountItem[];
  note?: string;
}) {
  const width = 560;
  const height = 180;
  const paddingX = 34;
  const paddingY = 24;
  const max = Math.max(...items.map((item) => item.count), 1);
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;
  const points = items.map((item, index) => {
    const x = paddingX + (items.length === 1 ? 0 : (index / (items.length - 1)) * usableWidth);
    const y = paddingY + usableHeight - (item.count / max) * usableHeight;

    return { ...item, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="rounded-lg border border-[#E3E6EA] bg-white p-5 shadow-sm">
      <H2 className="text-[1.7rem] text-[#111827]" weight="SemiBold">
        {title}
      </H2>
      <div className="mt-4 overflow-x-auto">
        <svg className="min-w-[56rem]" viewBox={`0 0 ${width} ${height}`} role="img">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingY + usableHeight - ratio * usableHeight;

            return (
              <line
                key={ratio}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="#EEF2F6"
                strokeWidth="1"
              />
            );
          })}
          <polyline
            fill="none"
            points={polyline}
            stroke="#2E90FA"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          {points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} fill="#FFFFFF" r="6" stroke="#2E90FA" strokeWidth="3" />
              <text
                x={point.x}
                y={point.y - 12}
                fill="#475467"
                fontSize="12"
                textAnchor="middle"
              >
                {point.count}
              </text>
              <text
                x={point.x}
                y={height - 4}
                fill="#667085"
                fontSize="11"
                textAnchor="middle"
              >
                {formatLabel(point.label)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {note && (
        <Body className="mt-3 text-[1.2rem] text-[#667085]" weight="Regular">
          {note}
        </Body>
      )}
    </section>
  );
}

function InstitutionConcentration({
  institutions,
  total,
}: {
  institutions: CountItem[];
  total: number;
}) {
  const sorted = sortItems(institutions);
  const topInstitution = sorted[0];
  const top5 = sorted.slice(0, 5).reduce((sum, item) => sum + item.count, 0);
  const top10 = sorted.slice(0, 10).reduce((sum, item) => sum + item.count, 0);
  const singletons = sorted.filter((item) => item.count === 1).length;
  const cards = [
    {
      label: "Maior instituição",
      value: topInstitution?.label || "-",
      detail: topInstitution ? `${topInstitution.count} bolsistas` : "Sem dados",
    },
    {
      label: "Top 5",
      value: `${percent(top5, total)}%`,
      detail: `${top5} bolsistas nas 5 maiores instituições`,
    },
    {
      label: "Top 10",
      value: `${percent(top10, total)}%`,
      detail: `${top10} bolsistas nas 10 maiores instituições`,
    },
    {
      label: "Instituições isoladas",
      value: singletons,
      detail: "Instituições com apenas 1 bolsista",
    },
  ];

  return (
    <section className="mt-6 rounded-lg border border-[#E3E6EA] bg-white p-5 shadow-sm">
      <H2 className="text-[1.8rem] text-[#111827]" weight="SemiBold">
        Concentração institucional
      </H2>
      <Body className="mt-1 text-[1.3rem] text-[#667085]" weight="Regular">
        Métricas diretas calculadas a partir da instituição informada no dataset.
      </Body>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-[#E3E6EA] bg-[#F8FAFC] p-4">
            <Body className="text-[1.2rem] uppercase tracking-wide text-[#667085]" weight="Medium">
              {card.label}
            </Body>
            <div className="mt-2 truncate text-[2rem] font-semibold leading-tight text-[#111827]">
              {card.value}
            </div>
            <Body className="mt-1 text-[1.2rem] text-[#667085]" weight="Regular">
              {card.detail}
            </Body>
          </div>
        ))}
      </div>
    </section>
  );
}

function DynamicRankingChart({
  metrics,
  total,
}: {
  metrics: DashboardMetrics;
  total: number;
}) {
  type DynamicOption = {
    id: string;
    label: string;
    title: string;
    items?: CountItem[];
    sexRows?: CrossChartRow[];
    limit: number;
    sortOrder?: string[];
    total?: number;
    tone: "default" | "green" | "blue";
  };

  const options = [
    {
      id: "scholarship_levels",
      label: "Bolsas",
      title: "Distribuição por nível de bolsa",
      items: metrics.distributions.scholarship_levels,
      limit: 12,
      sortOrder: scholarshipDifficultyOrder,
      total,
      tone: "blue",
    },
    {
      id: "regions",
      label: "Regiões",
      title: "Distribuição regional",
      items: metrics.distributions.institution_regions,
      limit: 8,
      total,
      tone: "green",
    },
    {
      id: "sex",
      label: "Sexo",
      title: "Sexo inferido",
      items: metrics.distributions.sex,
      limit: 6,
      total,
      tone: "blue",
    },
    {
      id: "state_sex",
      label: "Sexo por estado",
      title: "Estados com maior proporção de mulheres",
      sexRows: metrics.analysis.cross_charts.state_by_sex,
      limit: 15,
      tone: "green",
    },
    {
      id: "institutions",
      label: "Instituições",
      title: "Instituições com mais bolsistas",
      items: metrics.distributions.institutions,
      limit: 15,
      tone: "blue",
    },
    {
      id: "areas",
      label: "Áreas",
      title: "Áreas principais inferidas",
      items: metrics.distributions.main_research_areas,
      limit: 15,
      tone: "green",
    },
    {
      id: "topics",
      label: "Tópicos",
      title: "Tópicos frequentes",
      items: metrics.top_terms.research_topics,
      limit: 15,
      tone: "default",
    },
    {
      id: "ufs",
      label: "Estados",
      title: "Estados com mais bolsistas",
      items: metrics.distributions.institution_ufs,
      limit: 15,
      tone: "blue",
    },
  ] satisfies DynamicOption[];
  const [selectedId, setSelectedId] = useState(options[0].id);
  const [minSexGroupTotal, setMinSexGroupTotal] = useState(5);
  const selected = options.find((option) => option.id === selectedId) || options[0];
  const visible = (
    selected.sortOrder
      ? sortItemsByOrder(selected.items || [], selected.sortOrder)
      : sortItems(selected.items || [])
  ).slice(0, selected.limit);
  const visibleSexRows = [...(selected.sexRows || [])]
    .map((row) => {
      const female = row.values.female || 0;
      const male = row.values.male || 0;
      const knownTotal = female + male;
      const femalePercent = knownTotal ? percent(female, knownTotal) : 0;

      return { ...row, female, male, knownTotal, femalePercent };
    })
    .filter((row) => row.knownTotal >= minSexGroupTotal)
    .sort((a, b) => b.femalePercent - a.femalePercent || b.female - a.female);
  const totalSexRows = (selected.sexRows || []).filter((row) => {
    const female = row.values.female || 0;
    const male = row.values.male || 0;

    return female + male > 0;
  }).length;
  const max = Math.max(...visible.map((item) => item.count), 1);
  const color =
    selected.tone === "green"
      ? "bg-[#12B76A]"
      : selected.tone === "blue"
        ? "bg-[#2E90FA]"
        : "bg-[#475467]";

  return (
    <section className="mt-6 rounded-lg border border-[#D0D5DD] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <H2 className="text-[1.9rem] text-[#111827]" weight="SemiBold">
            Explorar distribuição
          </H2>
          <Body className="mt-1 max-w-[70rem] text-[1.3rem] text-[#667085]" weight="Regular">
            Use os filtros para alternar a leitura principal do dataset sem sair do dashboard.
          </Body>
        </div>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = option.id === selected.id;

            return (
              <button
                key={option.id}
                className={cn(
                  "rounded-md border px-3 py-2 text-[1.2rem] font-medium transition",
                  active
                    ? "border-[#2E90FA] bg-[#EFF8FF] text-[#175CD3]"
                    : "border-[#D0D5DD] bg-white text-[#475467] hover:border-[#98A2B3]"
                )}
                onClick={() => setSelectedId(option.id)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Body className="text-[1.45rem] text-[#111827]" weight="SemiBold">
            {selected.title}
          </Body>
          {selected.sexRows && (
            <div className="flex flex-col gap-1 md:items-end">
              <label className="flex items-center gap-2 text-[1.2rem] font-medium text-[#475467]">
                Mínimo de pessoas
                <input
                  className="h-9 w-20 rounded-md border border-[#D0D5DD] px-2 text-[1.25rem] text-[#111827] outline-none focus:border-[#2E90FA]"
                  min={1}
                  onChange={(event) =>
                    setMinSexGroupTotal(Math.max(1, Number(event.target.value) || 1))
                  }
                  type="number"
                  value={minSexGroupTotal}
                />
              </label>
              <Body className="text-[1.1rem] text-[#667085]" weight="Regular">
                {visibleSexRows.length} de {totalSexRows} estado(s) exibido(s)
              </Body>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {selected.sexRows
            ? visibleSexRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid gap-2 md:grid-cols-[22rem_minmax(0,1fr)_13rem] md:items-center"
                  >
                    <Body className="truncate text-[1.3rem] text-[#344054]" weight="Medium">
                      {formatLabel(row.label)}
                    </Body>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
                      <div
                        className="h-full bg-[#12B76A]"
                        style={{ width: `${row.femalePercent}%` }}
                        title={`Mulher: ${row.female}`}
                      />
                      <div
                        className="h-full bg-[#2E90FA]"
                        style={{ width: `${100 - row.femalePercent}%` }}
                        title={`Homem: ${row.male}`}
                      />
                    </div>
                    <Body className="text-[1.25rem] text-[#667085] md:text-right" weight="Regular">
                      {row.femalePercent}% mulher ({row.female}/{row.knownTotal})
                    </Body>
                  </div>
                ))
            : visible.map((item) => (
                <div
                  key={item.label}
                  className="grid gap-2 md:grid-cols-[22rem_minmax(0,1fr)_8rem] md:items-center"
                >
                  <Body className="truncate text-[1.3rem] text-[#344054]" weight="Medium">
                    {formatLabel(item.label)}
                  </Body>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
                    <div
                      className={cn("h-full rounded-full", color)}
                      style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }}
                    />
                  </div>
                  <Body className="text-[1.25rem] text-[#667085] md:text-right" weight="Regular">
                    {item.count}
                    {selected.total ? ` (${percent(item.count, selected.total)}%)` : ""}
                  </Body>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

function SexByScholarshipHeatmap({
  rows,
}: {
  rows: CrossChartRow[];
}) {
  const rowMap = new Map(rows.map((row) => [row.label, row]));
  const columns = scholarshipDifficultyOrder.filter((column) => rowMap.has(column));
  const sexRows = [
    {
      key: "male",
      label: "Homem",
      total: columns.reduce((sum, column) => sum + (rowMap.get(column)?.values.male || 0), 0),
    },
    {
      key: "female",
      label: "Mulher",
      total: columns.reduce((sum, column) => sum + (rowMap.get(column)?.values.female || 0), 0),
    },
  ];
  const maxCell = Math.max(
    ...sexRows.flatMap((row) => columns.map((column) => rowMap.get(column)?.values[row.key] || 0)),
    1
  );

  return (
    <section className="rounded-lg border border-[#D0D5DD] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <H2 className="text-[2rem] text-[#111827]" weight="SemiBold">
            Sexo inferido por nível de bolsa
          </H2>
          <Body className="mt-1 text-[1.3rem] text-[#667085]" weight="Regular">
            Matriz de contagem direta entre sexo inferido e nível real da bolsa.
          </Body>
        </div>
        <Body className="text-[1.2rem] text-[#667085]" weight="Regular">
          Quanto mais escuro, maior a concentração naquela célula.
        </Body>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[72rem] border-separate border-spacing-1 text-left">
          <thead>
            <tr>
              <th className="px-3 py-2 text-[1.2rem] font-semibold text-[#667085]">Sexo</th>
              <th className="px-3 py-2 text-center text-[1.2rem] font-semibold text-[#667085]">
                Total
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-3 py-2 text-center text-[1.2rem] font-semibold text-[#667085]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sexRows.map((row) => (
              <tr key={row.key}>
                <td className="whitespace-nowrap rounded-md bg-[#F8FAFC] px-3 py-2 text-[1.25rem] font-medium text-[#344054]">
                  {row.label}
                </td>
                <td className="rounded-md bg-[#F8FAFC] px-3 py-2 text-center text-[1.25rem] font-semibold text-[#111827]">
                  {row.total}
                </td>
                {columns.map((column) => {
                  const value = rowMap.get(column)?.values[row.key] || 0;
                  const alpha = value ? 0.12 + (value / maxCell) * 0.78 : 0;

                  return (
                    <td
                      key={column}
                      className="rounded-md px-3 py-2 text-center text-[1.25rem] font-semibold"
                      style={{
                        backgroundColor: value ? `rgba(46, 144, 250, ${alpha})` : "#F8FAFC",
                        color: alpha > 0.48 ? "#FFFFFF" : "#344054",
                      }}
                      title={`${row.label} - ${column}: ${value}`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CrossTable({
  title,
  rows,
  limit = 8,
  columnOrder,
}: {
  title: string;
  rows: CrossChartRow[];
  limit?: number;
  columnOrder?: string[];
}) {
  const visible = [...rows].sort((a, b) => b.total - a.total).slice(0, limit);
  const allColumns = Array.from(new Set(visible.flatMap((row) => Object.keys(row.values || {}))));
  const columns = columnOrder
    ? [
        ...columnOrder.filter((column) => allColumns.includes(column)),
        ...allColumns.filter((column) => !columnOrder.includes(column)).sort(),
      ]
    : allColumns.slice(0, 6);

  return (
    <section className="rounded-lg border border-[#E3E6EA] bg-white p-5 shadow-sm">
      <H2 className="text-[1.7rem] text-[#111827]" weight="SemiBold">
        {title}
      </H2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E3E6EA]">
              <th className="py-2 pr-3 text-[1.2rem] font-semibold text-[#667085]">Grupo</th>
              <th className="py-2 px-3 text-[1.2rem] font-semibold text-[#667085]">Total</th>
              {columns.map((column) => (
                <th key={column} className="py-2 px-3 text-[1.2rem] font-semibold text-[#667085]">
                  {formatLabel(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.label} className="border-b border-[#F2F4F7] last:border-0">
                <td className="max-w-[20rem] truncate py-2 pr-3 text-[1.25rem] text-[#344054]">
                  {formatLabel(row.label)}
                </td>
                <td className="py-2 px-3 text-[1.25rem] font-semibold text-[#111827]">
                  {row.total}
                </td>
                {columns.map((column) => (
                  <td key={column} className="py-2 px-3 text-[1.25rem] text-[#475467]">
                    {row.values?.[column] || 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RegionByScholarshipBarChart({
  rows,
}: {
  rows: CrossChartRow[];
}) {
  const columns = scholarshipDifficultyOrder.filter((column) =>
    rows.some((row) => (row.values[column] || 0) > 0)
  );
  const visibleRows = [...rows].sort((a, b) => b.total - a.total);
  const maxCell = Math.max(
    ...visibleRows.flatMap((row) => columns.map((column) => row.values[column] || 0)),
    1
  );

  return (
    <section className="rounded-lg border border-[#D0D5DD] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <H2 className="text-[2rem] text-[#111827]" weight="SemiBold">
            Região por nível de bolsa
          </H2>
          <Body className="mt-1 text-[1.3rem] text-[#667085]" weight="Regular">
            Matriz de contagem direta: linhas são regiões e colunas são níveis reais da bolsa.
          </Body>
        </div>
        <Body className="text-[1.2rem] text-[#667085]" weight="Regular">
          Quanto mais escuro, maior a concentração naquela célula.
        </Body>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[78rem] border-separate border-spacing-1 text-left">
          <thead>
            <tr>
              <th className="px-3 py-2 text-[1.2rem] font-semibold text-[#667085]">Região</th>
              <th className="px-3 py-2 text-center text-[1.2rem] font-semibold text-[#667085]">
                Total
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-3 py-2 text-center text-[1.2rem] font-semibold text-[#667085]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.label}>
                <td className="whitespace-nowrap rounded-md bg-[#F8FAFC] px-3 py-2 text-[1.25rem] font-medium text-[#344054]">
                  {formatLabel(row.label)}
                </td>
                <td className="rounded-md bg-[#F8FAFC] px-3 py-2 text-center text-[1.25rem] font-semibold text-[#111827]">
                  {row.total}
                </td>
                {columns.map((column) => {
                  const value = row.values[column] || 0;
                  const alpha = value ? 0.12 + (value / maxCell) * 0.78 : 0;

                  return (
                    <td
                      key={column}
                      className="rounded-md px-3 py-2 text-center text-[1.25rem] font-semibold"
                      style={{
                        backgroundColor: value ? `rgba(46, 144, 250, ${alpha})` : "#F8FAFC",
                        color: alpha > 0.48 ? "#FFFFFF" : "#344054",
                      }}
                      title={`${column} - ${formatLabel(row.label)}: ${value}`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DoctorateByScholarshipHeatmap({
  rows,
}: {
  rows: CrossChartRow[];
}) {
  const rowOrder = ["0_4", "5_9", "10_19", "20_29", "30_plus", "unknown"];
  const columnOrder = [...scholarshipDifficultyOrder, "unknown"];
  const rowMap = new Map(rows.map((row) => [row.label, row]));
  const visibleRows = rowOrder.map((label) => rowMap.get(label)).filter(Boolean) as CrossChartRow[];
  const columns = columnOrder.filter((column) =>
    visibleRows.some((row) => (row.values[column] || 0) > 0)
  );
  const maxCell = Math.max(
    ...visibleRows.flatMap((row) => columns.map((column) => row.values[column] || 0)),
    1
  );

  return (
    <section className="rounded-lg border border-[#D0D5DD] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <H2 className="text-[2rem] text-[#111827]" weight="SemiBold">
            Tempo desde doutorado por nível de bolsa
          </H2>
          <Body className="mt-1 text-[1.3rem] text-[#667085]" weight="Regular">
            Cruzamento direto entre faixa de experiência acadêmica e nível real da bolsa.
          </Body>
        </div>
        <Body className="text-[1.2rem] text-[#667085]" weight="Regular">
          Quanto mais escuro, maior a concentração naquela célula.
        </Body>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[82rem] border-separate border-spacing-1 text-left">
          <thead>
            <tr>
              <th className="px-3 py-2 text-[1.2rem] font-semibold text-[#667085]">
                Tempo desde doutorado
              </th>
              <th className="px-3 py-2 text-center text-[1.2rem] font-semibold text-[#667085]">
                Total
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-3 py-2 text-center text-[1.2rem] font-semibold text-[#667085]"
                >
                  {formatLabel(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.label}>
                <td className="whitespace-nowrap rounded-md bg-[#F8FAFC] px-3 py-2 text-[1.25rem] font-medium text-[#344054]">
                  {doctorateBucketLabels[row.label] || formatLabel(row.label)}
                </td>
                <td className="rounded-md bg-[#F8FAFC] px-3 py-2 text-center text-[1.25rem] font-semibold text-[#111827]">
                  {row.total}
                </td>
                {columns.map((column) => {
                  const value = row.values[column] || 0;
                  const alpha = value ? 0.12 + (value / maxCell) * 0.78 : 0;

                  return (
                    <td
                      key={column}
                      className="rounded-md px-3 py-2 text-center text-[1.25rem] font-semibold"
                      style={{
                        backgroundColor: value ? `rgba(18, 183, 106, ${alpha})` : "#F8FAFC",
                        color: alpha > 0.48 ? "#FFFFFF" : "#344054",
                      }}
                      title={`${doctorateBucketLabels[row.label] || row.label} - ${formatLabel(column)}: ${value}`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DashboardScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMetrics() {
      try {
        setLoading(true);
        const response = await mainApi.get<DashboardMetrics>("/dashboard/metrics");

        if (active) {
          setMetrics(response.data);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar as métricas do dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMetrics();

    return () => {
      active = false;
    };
  }, []);

  const total = metrics?.dataset.total_profiles || 0;
  const doctorateItems = metrics
    ? doctorateBucketOrder.filter((bucket) => bucket !== "unknown").map((bucket) => ({
        label: doctorateBucketLabels[bucket] || bucket,
        count: metrics.distributions.doctorate_years.buckets[bucket] || 0,
      }))
    : [];
  const doctorateUnknown = metrics?.distributions.doctorate_years.buckets.unknown || 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-8 py-8">
        <div className="mx-auto max-w-[128rem]">
          <div className="h-10 w-80 animate-pulse rounded-md bg-[#E3E6EA]" />
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-lg bg-white" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !metrics) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-8 py-8">
        <div className="mx-auto max-w-[128rem] rounded-lg border border-[#FDA29B] bg-white p-6">
          <H2 className="text-[2rem] text-[#B42318]" weight="SemiBold">
            Dashboard indisponível
          </H2>
          <Body className="mt-2 text-[1.4rem] text-[#667085]" weight="Regular">
            {error}
          </Body>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-[132rem]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <H2 className="text-[2.8rem] text-[#111827]" weight="SemiBold">
              Dashboard de Bolsistas PQ
            </H2>
            <Body className="mt-2 max-w-[76rem] text-[1.4rem] text-[#667085]" weight="Regular">
              Métricas consolidadas do dataset ativo para avaliar distribuição de bolsas,
              instituições, áreas de pesquisa, experiência e diversidade inferida.
            </Body>
          </div>
          <Body className="text-[1.25rem] text-[#667085]" weight="Regular">
            Dados ativos: {total} perfis
          </Body>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Bolsistas" value={total} detail="Total no dataset ativo" />
          <MetricCard
            label="Instituições"
            value={metrics.analysis.recommended_cards.institutions_count}
            detail="Instituições representadas"
          />
          <MetricCard
            label="UFs"
            value={metrics.analysis.recommended_cards.ufs_count}
            detail="Estados representados"
          />
          <SexDonutCard items={metrics.distributions.sex} total={total} />
        </section>

        <DynamicRankingChart metrics={metrics} total={total} />

        <section className="mt-6">
          <SexByScholarshipHeatmap
            rows={metrics.analysis.cross_charts.sex_by_scholarship_level}
          />
        </section>

        <InstitutionConcentration institutions={metrics.distributions.institutions} total={total} />

        <section className="mt-6">
          <RegionByScholarshipBarChart
            rows={metrics.analysis.cross_charts.region_by_scholarship_level}
          />
        </section>

        <section className="mt-6">
          <DoctorateByScholarshipHeatmap
            rows={metrics.analysis.cross_charts.scholarship_level_by_doctorate_age}
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <LineChart
            title="Ano de doutorado por faixa"
            items={doctorateItems}
            note={`${doctorateUnknown} perfil(is) sem ano de doutorado identificado.`}
          />
          <BarList
            title="Senioridade inferida"
            items={metrics.distributions.seniority}
            total={total}
            tone="green"
          />
        </section>

        <section className="mt-6 grid gap-4">
          <CrossTable
            title="Área por nível de bolsa"
            rows={metrics.analysis.cross_charts.area_by_scholarship_level}
            columnOrder={scholarshipDifficultyOrder}
            limit={10}
          />
        </section>
      </div>
    </main>
  );
}
