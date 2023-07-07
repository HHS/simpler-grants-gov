# Use Mural for design diagrams and whiteboarding

- **Status:** Proposed <!-- REQUIRED -->
- **Last Modified:** {YYYY-MM-DD when the decision was last updated} <!-- REQUIRED -->
- **Related Issue:** [#116](https://github.com/HHS/grants-api/issues/116) <!-- RECOMMENDED -->
- **Deciders:** Andy Cochran, Emily Ianacone, Sumi Thaiveettil, Aaron Couch, Billy Daly, Lucan Brown <!-- REQUIRED -->
- **Tags:** design <!-- OPTIONAL -->

## Context and Problem Statement

Which tool should be used for diagramming and whiteboarding? This tool is a primary concern for design in the creation of low-fidelity wireframes, process/logic flows, journey maps, service blueprints.

This diagramming tool will not be used only by designers. The right option will double as a whiteboarding tool for all disciplines, eliminating the need for a separate whiteboard tool. However, the goal here is not to prevent duplicative tools. There are programmatic methods of generating diagrams (e.g. MermaidJS) that will likely be used for creating architectural diagrams and tecnhical documentation in a machine-readable, version-controled format.

Note that the intended use for this particular tool is collaborative drawing.

## Decision Drivers <!-- RECOMMENDED -->

- Collborative editing
- Functions as both a digramming tool and a general whiteboard
- Useful to all disciplines (design, engineering, product, project)

## Options Considered

- Mural
- Lucidchart
- Miro
- Visio
- Figjam
- Draw.io
- ClickUp

## Decision Outcome <!-- REQUIRED -->

Chosen option: Mural, because HHS has existing licenses and Nava has extensive experience using it for multiple purposes (diagrams, whiteboard, research synthesis, brainstorming, etc.). Mural is very effective as a collaborative drawing canvas. And it will be valuable to all disciplines for various purposes.

### Positive Consequences <!-- OPTIONAL -->

- Mural can be used for sprint retrospective board, eliminating the need for an retro-specific tool
- Nava has found that using diagrams as the artifact engineers reference in implementation is an especially fast way of working with a design system (USDWS), preventing misinterpretation of visual design intent.

### Negative Consequences <!-- OPTIONAL -->

None, realy. There's a possible duplication of tool capabilities — Figma comes with Figjam, which has similar features; engineers may prefer MermaidJS for diagraming — which may justify further analysis in the future.

## Pros and Cons of the Options <!-- OPTIONAL -->

### Mural

- **Pro**
  - Can begin using immediately:
    - Existing HHS licenses
    - Existing Nava licenses
  - Nava familiarity
  - Large selection of templates for many purposes (brainstorms, retros, research, planning…)
  - Integrations with other products (Slack, GSuite…)
  - All the standard whiteboarding features:
    - Sharing / commenting
    - Real-time user following (useful in presentations)
    - Timer for collaborative sessions
    - etc.
- **Cons**
  - Free tier limited to 3 Murals

### Lucidchart

Note: If in the use of Mural, it becomes evident that the project would benefit from an additional tool that's more specifically made for drawing diagrams, Lucidchart should be chosen over the remaining options. However, choosing Lucidchart for that purpose would not require reevaluating Mural as a whiteboarding tool.

- **Pro**
  - Excells at flow charts, ER models, UML diagrams
  - Great user/access/file management
- **Cons**
  - Not effective as a whiteboarding tool

## Miro

- **Pro**
  - Basically Mural
  - Includes video conferencing (not necessary?)
- **Cons**
  - Fewer facilitator tools than Mural

## Visio

- **Pro**
  - Integrates with Office 365 products
  - Great selection of diagramming symbols
- **Cons**
  - Pricey / not accessible for FOSS community

## Figjam

- **Pro**
  - Comes with Figma
  - Freemium version
  - Simple UI
  - Actively/regularly improved by Figma
- **Cons**
  - Less mature product (recent acquisition of Diagram)

## Draw.io

- **Pro**
  - Totally free
  - Confluence integration (among others)
- **Cons**
  - Missing some drawing features
  - Not effective as a whiteboarding tool
  - Nava has experienced UI bugginess resulting in lost work
  - File management is not intuitive (especially when synced to Sharepoint)

## ClickUp

- **Pro**
  - Includes project management features, tasks, whiteboards, dashboards, chat, wiki… 
- **Cons**
  - More of a suite of products trying to compete with Atlassian, 365, etc
  - "One app to replace them all" requires relying on whole suite to get the most of its features
