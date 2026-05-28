import json
from collections import Counter
from pathlib import Path
from typing import Any


CURRENT_PATH = Path("scrape_results") / "current.json"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def semantic_value(profile: dict, field_id: str, default=None):
    semantic_profile = profile.get("semantic_profile") or {}
    field = semantic_profile.get(field_id) or {}

    return field.get("value", default)


def increment(counter: Counter, value, fallback: str = "unknown") -> None:
    if value is None or value == "":
        value = fallback

    if isinstance(value, list):
        if not value:
            counter[fallback] += 1
            return

        for item in value:
            increment(counter, item, fallback)
        return

    counter[str(value)] += 1


def counter_items(counter: Counter, limit: int | None = None) -> list[dict]:
    items = counter.most_common(limit)

    return [
        {
            "label": label,
            "count": count,
        }
        for label, count in items
    ]


def normalize_label(value, fallback: str = "unknown") -> str:
    if value is None or value == "":
        return fallback

    return str(value)


def boolean_count(profiles: list[dict], field_id: str) -> dict:
    counts = Counter()

    for profile in profiles:
        value = semantic_value(profile, field_id)

        if value is True:
            counts["true"] += 1
        elif value is False:
            counts["false"] += 1
        else:
            counts["unknown"] += 1

    return dict(counts)


def crosstab(
    profiles: list[dict],
    row_getter,
    column_getter,
    row_limit: int | None = None,
) -> list[dict]:
    row_totals = Counter()
    matrix = {}

    for profile in profiles:
        row = normalize_label(row_getter(profile))
        column = normalize_label(column_getter(profile))
        row_totals[row] += 1
        matrix.setdefault(row, Counter())[column] += 1

    rows = [row for row, _count in row_totals.most_common(row_limit)]

    return [
        {
            "label": row,
            "total": row_totals[row],
            "values": dict(matrix[row]),
        }
        for row in rows
    ]


def years_since_doctorate_bucket(value) -> str:
    if not isinstance(value, int):
        return "unknown"

    if value < 5:
        return "0_4"
    if value < 10:
        return "5_9"
    if value < 20:
        return "10_19"
    if value < 30:
        return "20_29"

    return "30_plus"


def doctorate_year_distribution(profiles: list[dict]) -> dict:
    buckets = Counter()
    years = []

    for profile in profiles:
        year = semantic_value(profile, "doctorate_year")

        if not isinstance(year, int):
            buckets["unknown"] += 1
            continue

        years.append(year)

        if year < 1990:
            buckets["before_1990"] += 1
        elif year < 2000:
            buckets["1990_1999"] += 1
        elif year < 2010:
            buckets["2000_2009"] += 1
        elif year < 2020:
            buckets["2010_2019"] += 1
        else:
            buckets["2020_plus"] += 1

    return {
        "buckets": dict(buckets),
        "min": min(years) if years else None,
        "max": max(years) if years else None,
    }


def load_active_profiles() -> tuple[dict, list[dict]]:
    if not CURRENT_PATH.exists():
        raise FileNotFoundError("scrape_results/current.json não encontrado")

    current = read_json(CURRENT_PATH)
    profiles_path = current.get("profiles_with_inferences_json")

    if not profiles_path:
        raise FileNotFoundError("current.json não aponta para profiles_with_inferences_json")

    path = Path(profiles_path)

    if not path.exists():
        raise FileNotFoundError(f"profiles_with_inferences_json não encontrado: {path}")

    return current, read_json(path)


def build_dashboard_metrics() -> dict:
    current, profiles = load_active_profiles()
    total = len(profiles)
    review_count = 0
    scholarship_levels = Counter()
    scholarship_categories = Counter()
    institutions = Counter()
    ufs = Counter()
    regions = Counter()
    sex = Counter()
    main_areas = Counter()
    career_stages = Counter()
    academic_ranks = Counter()
    seniority = Counter()
    research_topics = Counter()
    methods = Counter()
    application_domains = Counter()
    dashboard_tags = Counter()

    for profile in profiles:
        if any(
            (field or {}).get("needs_review")
            for field in (profile.get("semantic_profile") or {}).values()
        ):
            review_count += 1

        increment(scholarship_levels, profile.get("scholarship_level"))
        increment(scholarship_categories, semantic_value(profile, "scholarship_category"))
        increment(institutions, profile.get("institution"))
        increment(ufs, semantic_value(profile, "institution_state_uf"))
        increment(regions, semantic_value(profile, "institution_region"))
        increment(sex, semantic_value(profile, "sex_inferred"))
        increment(main_areas, semantic_value(profile, "main_research_area"))
        increment(career_stages, semantic_value(profile, "career_stage"))
        increment(academic_ranks, semantic_value(profile, "academic_rank"))
        increment(seniority, semantic_value(profile, "seniority_level"))
        increment(research_topics, semantic_value(profile, "research_topics"))
        increment(methods, semantic_value(profile, "methods_and_techniques"))
        increment(application_domains, semantic_value(profile, "application_domains"))
        increment(dashboard_tags, semantic_value(profile, "dashboard_tags"))

    inference_summary = None
    inference_summary_path = current.get("inference_summary_json")

    if inference_summary_path and Path(inference_summary_path).exists():
        inference_summary = read_json(Path(inference_summary_path))

    return {
        "dataset": {
            "total_profiles": total,
            "needs_review": review_count,
            "profiles_with_review_flags": review_count,
            "review_rate": review_count / total if total else 0,
            "current": current,
        },
        "quality": {
            "llm_errors": (inference_summary or {}).get("llm_errors"),
            "llm_repair_attempts": (inference_summary or {}).get("llm_repair_attempts"),
            "llm_repair_successes": (inference_summary or {}).get("llm_repair_successes"),
            "token_estimates": (inference_summary or {}).get("token_estimates"),
        },
        "distributions": {
            "scholarship_levels": counter_items(scholarship_levels),
            "scholarship_categories": counter_items(scholarship_categories),
            "institutions": counter_items(institutions),
            "institution_ufs": counter_items(ufs),
            "institution_regions": counter_items(regions),
            "sex": counter_items(sex),
            "main_research_areas": counter_items(main_areas),
            "career_stages": counter_items(career_stages),
            "academic_ranks": counter_items(academic_ranks, limit=30),
            "seniority": counter_items(seniority),
            "doctorate_years": doctorate_year_distribution(profiles),
        },
        "experience_flags": {
            "international_experience": boolean_count(profiles, "has_international_experience"),
            "industry_experience": boolean_count(profiles, "has_industry_experience"),
            "management_experience": boolean_count(profiles, "has_management_experience"),
            "editorial_or_event_experience": boolean_count(profiles, "has_editorial_or_event_experience"),
            "patents_or_software_outputs": boolean_count(profiles, "has_patents_or_software_outputs"),
        },
        "top_terms": {
            "research_topics": counter_items(research_topics, limit=40),
            "methods_and_techniques": counter_items(methods, limit=40),
            "application_domains": counter_items(application_domains, limit=40),
            "dashboard_tags": counter_items(dashboard_tags, limit=40),
        },
        "analysis": {
            "recommended_cards": {
                "total_profiles": total,
                "institutions_count": len(institutions),
                "ufs_count": len([uf for uf in ufs if uf != "unknown"]),
                "main_areas_count": len([area for area in main_areas if area != "unknown"]),
                "profiles_with_review_flags": review_count,
                "llm_errors": (inference_summary or {}).get("llm_errors"),
            },
            "grant_distribution": {
                "by_level": counter_items(scholarship_levels),
                "by_category": counter_items(scholarship_categories),
                "by_institution_top_20": counter_items(institutions, limit=20),
                "by_region": counter_items(regions),
                "by_uf": counter_items(ufs),
            },
            "research_landscape": {
                "main_areas_top_30": counter_items(main_areas, limit=30),
                "research_topics_top_40": counter_items(research_topics, limit=40),
                "methods_top_40": counter_items(methods, limit=40),
                "application_domains_top_30": counter_items(application_domains, limit=30),
            },
            "career_and_diversity": {
                "doctorate_years": doctorate_year_distribution(profiles),
                "career_stages": counter_items(career_stages),
                "seniority": counter_items(seniority),
                "sex": counter_items(sex),
            },
            "impact_and_leadership": {
                "international_experience": boolean_count(profiles, "has_international_experience"),
                "industry_experience": boolean_count(profiles, "has_industry_experience"),
                "management_experience": boolean_count(profiles, "has_management_experience"),
                "editorial_or_event_experience": boolean_count(profiles, "has_editorial_or_event_experience"),
                "patents_or_software_outputs": boolean_count(profiles, "has_patents_or_software_outputs"),
            },
            "cross_charts": {
                "area_by_scholarship_category": crosstab(
                    profiles,
                    lambda profile: semantic_value(profile, "main_research_area"),
                    lambda profile: semantic_value(profile, "scholarship_category"),
                    row_limit=30,
                ),
                "institution_by_main_area_top_20": crosstab(
                    profiles,
                    lambda profile: profile.get("institution"),
                    lambda profile: semantic_value(profile, "main_research_area"),
                    row_limit=20,
                ),
                "sex_by_scholarship_category": crosstab(
                    profiles,
                    lambda profile: semantic_value(profile, "sex_inferred"),
                    lambda profile: semantic_value(profile, "scholarship_category"),
                ),
                "sex_by_main_area_top_30": crosstab(
                    profiles,
                    lambda profile: semantic_value(profile, "main_research_area"),
                    lambda profile: semantic_value(profile, "sex_inferred"),
                    row_limit=30,
                ),
                "scholarship_category_by_doctorate_age": crosstab(
                    profiles,
                    lambda profile: years_since_doctorate_bucket(
                        semantic_value(profile, "years_since_doctorate")
                    ),
                    lambda profile: semantic_value(profile, "scholarship_category"),
                ),
                "region_by_scholarship_category": crosstab(
                    profiles,
                    lambda profile: semantic_value(profile, "institution_region"),
                    lambda profile: semantic_value(profile, "scholarship_category"),
                ),
            },
        },
    }
