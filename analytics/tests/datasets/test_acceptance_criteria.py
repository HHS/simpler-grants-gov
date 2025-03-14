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

Lorem ipsum

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
