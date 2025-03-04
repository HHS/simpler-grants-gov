"""Mock data output of the sprintboard data used in snapshot tests."""

from unittest.mock import Mock


def mock_graphql_sprintboard_data(
    _login=Mock,  # noqa: ANN001
    _project=Mock,  # noqa: ANN001
    _quad_field=Mock,  # noqa: ANN001
    _pillar_field=Mock,  # noqa: ANN001
) -> list[dict]:
    """Sprintboard input for snapshot testing."""
    return [
        {
            "content": {
                "title": "Follow up email with participants who didn't certify for January meeting",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3795",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-02-06T17:13:57Z",
                "closedAt": None,
                "parent": {
                    "title": "February Co-design meeting",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3664",
                },
            },
            "sprint": {
                "iterationId": "12af8f24",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": {"number": 1.0},
            "status": {"optionId": "0cd87c28", "name": "Blocked"},
        },
        {
            "content": {
                "title": "Update prod CNAME for CDN",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3337",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2024-12-20T17:48:43Z",
                "closedAt": None,
                "parent": {
                    "title": "[DRAFT] Launch the CDN",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3174",
                },
            },
            "sprint": {
                "iterationId": "12af8f24",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": None,
            "status": {"optionId": "0cd87c28", "name": "Blocked"},
        },
        {
            "content": {
                "title": "Caching strategy for the CDN in front of S3",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3437",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-01-07T18:00:05Z",
                "closedAt": None,
                "parent": {
                    "title": "Make attachment files available via the API",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3046",
                },
            },
            "sprint": {
                "iterationId": "12af8f24",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": None,
            "status": {"optionId": "0cd87c28", "name": "Blocked"},
        },
        {
            "content": {
                "title": "Draft Apply MVP scope for discussion",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3760",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-02-03T21:29:39Z",
                "closedAt": None,
                "parent": {
                    "title": "Simpler Application Workflow *",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3348",
                },
            },
            "sprint": {
                "iterationId": "12af8f24",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": None,
            "status": {"optionId": "96cf4210", "name": "In Review"},
        },
        {
            "content": {
                "title": "Implementation for enabling users to save an opportunity",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3306",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2024-12-18T21:51:03Z",
                "closedAt": None,
                "parent": {
                    "title": """Enable users to save an opportunity and
                      view/delete their saved opportunities""",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3118",
                },
            },
            "sprint": {
                "iterationId": "12af8f24",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": None,
            "status": {"optionId": "96cf4210", "name": "In Review"},
        },
        {
            "content": {
                "title": """Adjust GET saved-search endpoint to
                  take in sorting/pagination and use it""",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3692",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-01-30T19:05:06Z",
                "closedAt": None,
                "parent": {
                    "title": """Enable users to save a search and
                      view/open/delete their saved searches""",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3119",
                },
            },
            "sprint": {
                "iterationId": "12af8f24",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": None,
            "status": {"optionId": "96cf4210", "name": "In Review"},
        },
        {
            "content": {
                "title": "Container Vulnerability Scanning Plan",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3550",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-01-16T17:20:11Z",
                "closedAt": None,
                "parent": None,
            },
            "sprint": {
                "iterationId": "12af8f24",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": None,
            "status": {"optionId": "47fc9ee4", "name": "In Progress"},
        },
        {
            "content": {
                "title": "Create metadata for saved-grants page",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3752",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-02-03T19:01:10Z",
                "closedAt": "2025-02-06T18:57:51Z",
                "parent": {
                    "title": """Enable users to save an opportunity and
                      view/delete their saved opportunities""",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3118",
                },
            },
            "sprint": {
                "iterationId": "12af8f24",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": None,
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "WIldcard Certificates Plan",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3549",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-01-16T17:18:36Z",
                "closedAt": None,
                "parent": None,
            },
            "sprint": {
                "iterationId": "12af8f24",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": None,
            "status": {"optionId": "96cf4210", "name": "In Review"},
        },
        {
            "content": {
                "title": "[CLI] Publish v0.1.0-beta to npm",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/30",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-01T19:42:27Z",
                "closedAt": "2025-02-06T03:10:54Z",
                "parent": {
                    "title": "[Grant protocol] CLI tool",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3361",
                },
            },
            "sprint": {
                "iterationId": "ea360bde",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "[Branding] Choose the official name of the protocol",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/46",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-01-21T16:18:13Z",
                "closedAt": None,
                "parent": {
                    "title": "[Grant protocol] Branding",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3362",
                },
            },
            "sprint": {
                "iterationId": "ea360bde",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "47fc9ee4", "name": "In Progress"},
        },
        {
            "content": {
                "title": "[Docs] Quickstart guide",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/71",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-02-04T21:51:19Z",
                "closedAt": None,
                "parent": {
                    "title": "[Spec] Publish docs",
                    "url": "https://github.com/HHS/simpler-grants-protocol/issues/25",
                },
            },
            "sprint": {
                "iterationId": "ea360bde",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "47fc9ee4", "name": "In Progress"},
        },
        {
            "content": {
                "title": "[Docs] Draft specification",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/72",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-02-04T22:04:24Z",
                "closedAt": None,
                "parent": {
                    "title": "[Spec] Publish docs",
                    "url": "https://github.com/HHS/simpler-grants-protocol/issues/25",
                },
            },
            "sprint": {
                "iterationId": "ea360bde",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "47fc9ee4", "name": "In Progress"},
        },
        {
            "content": {
                "title": "[CLI] Create `cg init` command",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/63",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-30T03:57:25Z",
                "closedAt": "2025-02-10T14:15:24Z",
                "parent": {
                    "title": "[CLI] Create v0.1.0-beta",
                    "url": "https://github.com/HHS/simpler-grants-protocol/issues/40",
                },
            },
            "sprint": {
                "iterationId": "ea360bde",
                "title": "Sprint 2.3",
                "startDate": "2025-02-05",
                "duration": 14,
            },
            "points": {"number": 5.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "[Spec] Opportunity data model and base types",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/22",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-01T19:21:24Z",
                "closedAt": "2025-02-04T17:31:19Z",
                "parent": {
                    "title": "[Spec] Create v0.1.0-alpha library",
                    "url": "https://github.com/HHS/simpler-grants-protocol/issues/39",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "[Spec] Create v0.1.0-alpha library",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/39",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-02T00:11:32Z",
                "closedAt": "2025-02-04T19:14:27Z",
                "parent": {
                    "title": "[Grant protocol] Draft specification",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3360",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 1.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Document library - Gather and synthesize feedback",
                "url": "https://github.com/HHS/grants-product-and-delivery/issues/383",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T17:43:24Z",
                "closedAt": "2025-02-04T00:01:47Z",
                "parent": {
                    "title": "[Collaboration tool] Document library",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/2944",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 5.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Team health survey readout",
                "url": "https://github.com/HHS/grants-product-and-delivery/issues/384",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T17:45:48Z",
                "closedAt": "2025-02-04T00:01:54Z",
                "parent": {
                    "title": "[Team health] Survey",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/2946",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Baltimore offsite - Line up conference space",
                "url": "https://github.com/HHS/grants-product-and-delivery/issues/385",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-01-23T17:53:17Z",
                "closedAt": None,
                "parent": {
                    "title": "Baltimore Offsite Planning",
                    "url": "https://github.com/HHS/grants-product-and-delivery/issues/388",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 5.0},
            "status": {"optionId": "a47359d2", "name": "Blocked"},
        },
        {
            "content": {
                "title": "Baltimore offsite - Happy hour location",
                "url": "https://github.com/HHS/grants-product-and-delivery/issues/387",
                "issueType": {"name": "Task"},
                "closed": False,
                "createdAt": "2025-01-23T18:24:50Z",
                "closedAt": None,
                "parent": {
                    "title": "Baltimore Offsite Planning",
                    "url": "https://github.com/HHS/grants-product-and-delivery/issues/388",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": None,
            "status": {"optionId": "a47359d2", "name": "Blocked"},
        },
        {
            "content": {
                "title": "Refactor queries in delivery metrics dashboard",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3618",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T01:05:24Z",
                "closedAt": "2025-02-03T22:30:13Z",
                "parent": {
                    "title": "[Delivery metrics 2.0] Improve `analytics/` codebase",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/2930",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 5.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Sprint Dashboard: Table of tasks should link to GitHub",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3625",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T02:09:01Z",
                "closedAt": "2025-01-28T20:45:19Z",
                "parent": {
                    "title": "[Delivery metrics 2.0] Incorporate user feedback",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3380",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 1.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Metrics Dashboards: gather feedback from stakeholders",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3466",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-08T19:52:59Z",
                "closedAt": "2025-01-30T19:38:27Z",
                "parent": {
                    "title": "[Delivery metrics 2.0] Incorporate user feedback",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3380",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Delivery Dashboard: default to latest available data",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3619",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T01:14:37Z",
                "closedAt": "2025-01-30T21:19:14Z",
                "parent": {
                    "title": "[Delivery metrics 2.0] Incorporate user feedback",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3380",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Delivery Dashboard: reduce empty space in burnup/burndown charts",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3620",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T01:23:31Z",
                "closedAt": "2025-01-30T21:19:16Z",
                "parent": {
                    "title": "[Delivery metrics 2.0] Incorporate user feedback",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3380",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": """Delivery Dashboard: display data for deliverable
                  regardless of quad boundaries""",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3622",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T01:46:34Z",
                "closedAt": "2025-01-30T21:19:21Z",
                "parent": {
                    "title": "[Delivery metrics 2.0] Incorporate user feedback",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3380",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Delivery Dashboard: create option to show/hide closed issues",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3623",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T01:55:20Z",
                "closedAt": "2025-01-30T21:19:24Z",
                "parent": {
                    "title": "[Delivery metrics 2.0] Incorporate user feedback",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3380",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Delivery Dashboard: Table of tasks should link to GitHub",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3624",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T02:06:24Z",
                "closedAt": "2025-01-30T21:19:27Z",
                "parent": {
                    "title": "[Delivery metrics 2.0] Incorporate user feedback",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3380",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 1.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Delivery Dashboard: exclude done deliverables from percent pointed chart",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3621",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T01:33:21Z",
                "closedAt": "2025-01-30T21:19:31Z",
                "parent": {
                    "title": "[Delivery metrics 2.0] Incorporate user feedback",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3380",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "[Spike] Auto-generate API code from TypeSpec",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/48",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-23T18:08:18Z",
                "closedAt": "2025-01-29T19:17:25Z",
                "parent": {
                    "title": "[CLI] Planning and design",
                    "url": "https://github.com/HHS/simpler-grants-protocol/issues/27",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "ADR: Library publishing strategy",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/54",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-27T17:21:39Z",
                "closedAt": "2025-01-27T19:00:07Z",
                "parent": {
                    "title": "[Spec] Publish v0.1.0-beta to npm",
                    "url": "https://github.com/HHS/simpler-grants-protocol/issues/24",
                },
            },
            "sprint": {
                "iterationId": "66557168",
                "title": "Sprint 2.2",
                "startDate": "2025-01-22",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Document library - Create user research plan",
                "url": "https://github.com/HHS/grants-product-and-delivery/issues/379",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-08T20:23:40Z",
                "closedAt": "2025-01-21T16:48:45Z",
                "parent": {
                    "title": "[Collaboration tool] Document library",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/2944",
                },
            },
            "sprint": {
                "iterationId": "9b36ea5e",
                "title": "Sprint 2.1",
                "startDate": "2025-01-08",
                "duration": 14,
            },
            "points": {"number": 5.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Process and review survey results with Margaret",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/2954",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2024-11-20T16:46:38Z",
                "closedAt": "2025-01-21T16:49:08Z",
                "parent": {
                    "title": "[Team health] Survey",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/2946",
                },
            },
            "sprint": {
                "iterationId": "9b36ea5e",
                "title": "Sprint 2.1",
                "startDate": "2025-01-08",
                "duration": 14,
            },
            "points": {"number": 2.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Deprecate old `analytics/` code",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/3465",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-08T19:44:18Z",
                "closedAt": "2025-01-21T17:11:00Z",
                "parent": {
                    "title": "[Delivery metrics 2.0] Improve `analytics/` codebase",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/2930",
                },
            },
            "sprint": {
                "iterationId": "9b36ea5e",
                "title": "Sprint 2.1",
                "startDate": "2025-01-08",
                "duration": 14,
            },
            "points": {"number": 1.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "Update analytics documentation",
                "url": "https://github.com/HHS/simpler-grants-gov/issues/2130",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2024-09-17T19:49:02Z",
                "closedAt": "2025-01-21T17:06:02Z",
                "parent": {
                    "title": "Deprecate old `analytics/` code",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3465",
                },
            },
            "sprint": {
                "iterationId": "9b36ea5e",
                "title": "Sprint 2.1",
                "startDate": "2025-01-08",
                "duration": 14,
            },
            "points": {"number": 5.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "[Branding] Choose a working title for the protocol",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/31",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-01T19:45:22Z",
                "closedAt": "2025-01-21T20:10:12Z",
                "parent": {
                    "title": "[Grant protocol] Branding",
                    "url": "https://github.com/HHS/simpler-grants-gov/issues/3362",
                },
            },
            "sprint": {
                "iterationId": "9b36ea5e",
                "title": "Sprint 2.1",
                "startDate": "2025-01-08",
                "duration": 14,
            },
            "points": {"number": 2.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
        {
            "content": {
                "title": "[Spec] Draft a unified grant data model",
                "url": "https://github.com/HHS/simpler-grants-protocol/issues/19",
                "issueType": {"name": "Task"},
                "closed": True,
                "createdAt": "2025-01-01T19:12:56Z",
                "closedAt": "2025-01-20T20:53:26Z",
                "parent": {
                    "title": "[Spec] Planning and discovery",
                    "url": "https://github.com/HHS/simpler-grants-protocol/issues/34",
                },
            },
            "sprint": {
                "iterationId": "9b36ea5e",
                "title": "Sprint 2.1",
                "startDate": "2025-01-08",
                "duration": 14,
            },
            "points": {"number": 3.0},
            "status": {"optionId": "98236657", "name": "Done"},
        },
    ]
