{% for section in params.sections.values() %}
# {{ section.heading }}
{{ section.description }}

{% for milestone, details in section.milestones.items() %}
## {{ details.heading }}

| Property           | Value  |
| ------------------ | ------ |
| ID                 | `{{ milestone }}` |
| Status             | {{ details.status if details.status else "TODO" }} |
| Diagram Short Name | `{{ details.diagram_name }}` |

{% if details.dependencies %}
Dependencies: {% for dependency in details.dependencies -%}
`{{ dependency }}`{{", " if not loop.last else "" }}
{%- endfor %}
{%- else %}
Dependencies: None
{% endif %}

{{ details.description }}
{% endfor -%}
{% endfor -%}

# Appendix

Here is a template to use for these descriptions.

The first option below is for milestones that have not been defined according to the [Milestone Template](./milestone_template.md). It provides fields for a short description of the milestone.

The second option below is for milestones that have already been defined according to the [Milestone Template](./milestone_template.md). It provides a link to the template-based definition.

## Milestone name
Diagram short name: `-`

Dependencies: `-` or `None`

Short description.

OR

Diagram short name: `-`

[Link]()
