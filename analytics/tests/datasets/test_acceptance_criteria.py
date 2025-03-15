"""Tests the code in datasets/etl_acceptance_criteria.py."""

import pandas as pd
import pytest
from analytics.datasets.acceptance_criteria import (
    AcceptanceCriteriaDataset,
    AcceptanceCriteriaNestLevel,
    AcceptanceCriteriaTotal,
    AcceptanceCriteriaType,
)


@pytest.fixture(name="sample_json_data")
def sample_json_data_fixture() -> list[dict]:
    """Fixture for sample JSON data with real-world structure."""
    return [
        {
            "issue_url": "https://github.com/org/repo/issues/123",
            "issue_body": """### Summary
Lorem ipsum

### Press release

Lorem ipsum dolor sit amet

### Acceptance criteria

- [ ] **Specification:** Foo.
  - [x] **Standard fields:** Foo bar.
  - [x] **Custom fields:** Foo bar baz.
  - [x] **Defined types:** Foo bar baz baz.
- [ ] **Developer tools:** Foo bar bar bar barr.
- [ ] **Governance:** Foo bar

### Metrics

- [ ] **Popularity:** It is popular.
- [ ] **Engagement:** It has engagement.
- [ ] **Adoption:** Yes this too.

### Related goals

- **Develop product strategy** by doing xyz
- **Propose a governance structure** for abc123
- [ ] Random checkbox placement

### Assumptions and dependencies

- **Assumptions:**
  - **Separate repository:** Words go here.
  - **External hosting:** More words.
- **Dependencies:** None.
""",
        },
        {
            "issue_url": "https://github.com/org/repo/issues/456",
            "issue_body": """### Metrics

- [x] **Metric 1:** Some measurable metric.
- [ ] **Metric 2:** Another measurable metric.
""",
        },
        {
            "issue_url": "https://github.com/org/repo/issues/789",
            "issue_body": """### Random Section

- [ ] **Not Criteria:** This should not be counted.
- [x] **Unrelated Task:** Ignore this too.

### Acceptance criteria

- [ ] **Valid Criteria:** This should be counted.
- [x] **Another Valid Criteria:** This should also be counted.
""",
        },
    ]


@pytest.fixture(name="acceptance_criteria_dataset")
def acceptance_criteria_dataset_fixture(
    sample_json_data: list[dict],
) -> AcceptanceCriteriaDataset:
    """Fixture to create an instance of AcceptanceCriteriaDataset."""
    return AcceptanceCriteriaDataset.load_from_json_object(sample_json_data)


def test_load_from_json_object(sample_json_data: list[dict]) -> None:
    """Test that JSON data is correctly loaded into a DataFrame."""
    dataset = AcceptanceCriteriaDataset.load_from_json_object(sample_json_data)

    assert isinstance(dataset, AcceptanceCriteriaDataset)
    assert isinstance(dataset.df, pd.DataFrame)
    assert not dataset.df.empty
    assert "ghid" in dataset.df.columns
    assert "bodycontent" in dataset.df.columns
    assert dataset.df.iloc[0]["ghid"] == "org/repo/issues/123"


def test_transform_entity_id_columns() -> None:
    """Test that GitHub issue URLs are correctly transformed."""
    df = pd.DataFrame(
        {
            "ghid": [
                "https://github.com/org/repo/issues/123",
                "https://github.com/org/repo/issues/456",
            ],
        },
    )
    transformed_df = AcceptanceCriteriaDataset.transform_entity_id_columns(df)

    assert transformed_df["ghid"].iloc[0] == "org/repo/issues/123"
    assert transformed_df["ghid"].iloc[1] == "org/repo/issues/456"


def test_checkboxes_in_unrelated_sections_ignored(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Ensure checkboxes in non-relevant sections are ignored."""
    totals = acceptance_criteria_dataset.get_totals(
        "org/repo/issues/789",
        AcceptanceCriteriaType.MAIN,
        AcceptanceCriteriaNestLevel.ALL,
    )
    assert totals.criteria == 2  # Only the valid acceptance criteria should count
    assert totals.done == 1  # One valid checkbox is checked


def test_missing_criteria_section(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Ensure an issue without an acceptance criteria section returns zero counts."""
    totals = acceptance_criteria_dataset.get_totals(
        "org/repo/issues/456",
        AcceptanceCriteriaType.MAIN,
        AcceptanceCriteriaNestLevel.ALL,
    )
    assert totals.criteria == 0
    assert totals.done == 0


def test_malformed_checkboxes_ignored(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Ensure improperly formatted checkboxes are ignored."""
    malformed_body = """### Acceptance criteria

[x] Incorrect checkbox formatting
- [x ] Another malformed checkbox
"""
    totals = acceptance_criteria_dataset.parse_body_content(
        malformed_body,
        AcceptanceCriteriaType.MAIN,
        AcceptanceCriteriaNestLevel.ALL,
    )
    assert totals.criteria == 0
    assert totals.done == 0


def test_case_insensitive_section_headers(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Ensure section headers are case-insensitive."""
    case_variation_body = """### acceptance criteria

- [ ] **Valid Criteria:** Should be counted.
- [x] **Completed Criteria:** Also counted.
"""
    totals = acceptance_criteria_dataset.parse_body_content(
        case_variation_body,
        AcceptanceCriteriaType.MAIN,
        AcceptanceCriteriaNestLevel.ALL,
    )
    assert totals.criteria == 2
    assert totals.done == 1


def test_empty_body_content(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Ensure an empty body content does not cause errors and returns zero counts."""
    totals = acceptance_criteria_dataset.parse_body_content(
        "",
        AcceptanceCriteriaType.MAIN,
        AcceptanceCriteriaNestLevel.ALL,
    )
    assert totals.criteria == 0
    assert totals.done == 0


def test_whitespace_in_section_headers(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Ensure leading/trailing whitespace in section headers does not affect parsing."""
    whitespace_variation_body = """###  Acceptance criteria

- [ ] **Valid Criteria:** Should be counted.
- [x] **Completed Criteria:** Also counted.
"""
    totals = acceptance_criteria_dataset.parse_body_content(
        whitespace_variation_body,
        AcceptanceCriteriaType.MAIN,
        AcceptanceCriteriaNestLevel.ALL,
    )
    assert totals.criteria == 2
    assert totals.done == 1


def test_deeply_nested_checkboxes_all_levels(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Ensure all checkboxes are counted, even if nested 4 levels deep, when ALL is passed."""
    deep_nesting_body = """### Acceptance criteria

- [ ] Level 1
  - [ ] Level 2
    - [ ] Level 3
      - [x] Level 4
"""

    totals = acceptance_criteria_dataset.parse_body_content(
        deep_nesting_body, AcceptanceCriteriaType.MAIN, AcceptanceCriteriaNestLevel.ALL,
    )

    assert totals.criteria == 4
    assert totals.done == 1


def test_h2_h4_headers_dont_break_parsing(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Ensure H2 (##) and H4 (####) headers do not interfere with H3 (###) section parsing."""
    mixed_headers_body = """## High-Level Section

Some introductory text.

#### Pre-Acceptance Details

- [ ] This should NOT be counted.

### Acceptance criteria

- [ ] Level 1 criteria
  - [x] Level 2 criteria

#### Sub-details

- [ ] This should NOT be counted.
- [x] This should also NOT be counted.

### Metrics

- [ ] Metric 1
- [x] Metric 2

#### Additional Metrics

- [ ] Metric 3 This should NOT be counted.
- [x] Metric 4 This should NOT be counted.
"""

    totals = acceptance_criteria_dataset.parse_body_content(
        mixed_headers_body, AcceptanceCriteriaType.ALL, AcceptanceCriteriaNestLevel.ALL,
    )

    assert totals.criteria == 4
    assert totals.done == 2


def test_get_totals_with_no_data() -> None:
    """Test get_totals when dataset is empty."""
    empty_df = pd.DataFrame(columns=["ghid", "bodycontent"])
    dataset = AcceptanceCriteriaDataset(empty_df)

    totals = dataset.get_totals(
        "org/repo/issues/123",
        AcceptanceCriteriaType.ALL,
        AcceptanceCriteriaNestLevel.ALL,
    )

    assert isinstance(totals, AcceptanceCriteriaTotal)
    assert totals.criteria == 0
    assert totals.done == 0


def test_get_totals_with_valid_data(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Test get_totals with a valid issue URL."""
    totals = acceptance_criteria_dataset.get_totals(
        "org/repo/issues/123",
        AcceptanceCriteriaType.MAIN,
        AcceptanceCriteriaNestLevel.ALL,
    )

    assert isinstance(totals, AcceptanceCriteriaTotal)
    assert totals.criteria == 6
    assert totals.done == 3


def test_get_totals_nested_level_1(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Test get_totals filtering by Level 1 checkboxes only."""
    totals = acceptance_criteria_dataset.get_totals(
        "org/repo/issues/123",
        AcceptanceCriteriaType.MAIN,
        AcceptanceCriteriaNestLevel.LEVEL_1,
    )

    assert totals.criteria == 3
    assert totals.done == 0


def test_get_totals_nested_level_2(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Test get_totals filtering by Level 2 checkboxes only."""
    totals = acceptance_criteria_dataset.get_totals(
        "org/repo/issues/123",
        AcceptanceCriteriaType.MAIN,
        AcceptanceCriteriaNestLevel.LEVEL_2,
    )

    assert totals.criteria == 3
    assert totals.done == 3


def test_get_totals_with_metrics_section(
    acceptance_criteria_dataset: AcceptanceCriteriaDataset,
) -> None:
    """Test get_totals with a different section (Metrics)."""
    totals = acceptance_criteria_dataset.get_totals(
        "org/repo/issues/456",
        AcceptanceCriteriaType.METRICS,
        AcceptanceCriteriaNestLevel.ALL,
    )

    assert totals.criteria == 2
    assert totals.done == 1
