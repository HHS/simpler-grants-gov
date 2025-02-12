# Use NPM over Yarn Architectural Decision Records

* Deciders: @aligg, @sawyerh, @lorenyu
* Date: 2022-09


## Context and Problem Statement
Initially this template repo used yarn for package management. We moved to npm because:
* npm is pre-bundled with node, so using npm removes an installation step
* some projects work on government furnished equipment and an additional package installation (e.g. installing yarn) is a significant and time-consuming step
* npm and yarn are comparable in function for the purposes of this template


## Considered Options
We considered the merits of yarn and npm only when making this decision.

## Decision Outcome
Chose npm to reduce installations and bureaucratic hurdles for folks using this template out of the box.

## Links
* [Original github issue for reference](https://github.com/navapbc/template-application-nextjs/issues/11)
