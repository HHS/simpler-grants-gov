# Operator reply snippets

Program-owner reply templates for the bounty lifecycle. The Open Source Associate
drives most of these; escalations are noted per snippet. Replace every placeholder
(`@handle`, `#NNN`, `$AMOUNT`, `<date>`) before posting.

**Where each reply goes**

- **Public** (posted as a comment on the GitHub issue): claim confirmation, claim
  declines, stale notice, extension grant/deny, withdrawal confirmation.
- **Private** (email to the contributor; never on the public issue): eligibility
  declines, W-9 request, post-payout survey. Identity/eligibility outcomes are
  logged in the internal tracker row, not on the issue (SOP Part 5.2).
- **Internal** (the Tremendous handoff note) goes to Bounty Prgroam Administrator finance, not the contributor.

---

## Claim confirmation

> Public comment on the issue, after verifying the ToS ack and running the per-claim
> checklist (SOP Part 2.4). Governance: OS Associate.

```markdown
Thanks @handle — your claim is confirmed and you've been added to the tracking table. 🎉

A few reminders:
- Please email <opensource@grants.gov>, with your github handle and a link to the issue, so I can contact you privately during the claim process. (if you can beleive it, none of the messages you get here are automatic, and right now bounties run off a single person processing them with copy/paste 😅)
- This claim stays active for **14 days**. Keep it alive with a commit, comment, or push; otherwise it goes stale and reopens to others.
- Need more time? Comment a substantive progress update before the 14-day mark and you can request **one 7-day extension**.
- When you open your PR, include `Closes #NNN` in the description so it links back here.
- Payment is contingent on a merged PR meeting all acceptance criteria, two maintainer approvals, and the verification steps in the [Terms of Service](/documentation/bounties/paid-contributor-TOS.md).

Questions about scope or acceptance criteria? Just ask here. Happy building!
```

---

## Claim declined — cap exceeded

> Contributor already holds 3 active claims (SOP Rule 3). Governance: OS Associate.

```markdown
Thanks for your interest, @handle! You currently hold the maximum of **3 active claims** across the bounty program, so I can't add this one.

Once you close one out — by submitting a PR or withdrawing with `/withdraw`, comment `/claim` here again and I'll get you added.
```

---

## Claim declined — cooldown

> Contributor is in a cooldown window from repeated abandonment (Rule 6) or a
> CoC matter (Rule 23). Cooldowns are tracked in internal notes and surfaced only
> when the contributor next tries to claim. Governance: OS Associate (tracks),
> OS Lead (approves cooldown).

```markdown
Thanks @handle. I'm not able to accept new claims from you at this time — your account is in a temporary cooldown on new claims, ending **<date>**.

Any claim you already have in progress continues to its normal resolution. After the cooldown ends you're welcome to claim again. If you'd like to understand the reason or discuss it, email <opensource@grants.gov> and we'll follow up one-on-one.
```

---

## Claim declined — no ToS ack

> `/claim` posted without a complete, preceding acknowledgment (SOP Rule 2).
> Governance: OS Associate.

```markdown
Thanks @handle! Before I can record your claim, I need your [**Terms of Service acknowledgment**](https://github.com/HHS/simpler-grants-gov/blob/main/documentation/bounties/paid-contributor-TOS.md). Please post the text below as a comment, *then* comment `/claim` again:

> I have read and agree to the Simpler Grants Contributor Program Terms of Service. I confirm I am 18 or older, a US citizen, not a current or former HHS employee or contractor, and not on the OFAC SDN list. I understand that payment requires a merged PR, verification, and W-9 documentation if my cumulative program payments this year will reach $600.

Heads up: for tiebreaker purposes your claim timestamp is set to the time of a **complete** acknowledgment, not the `/claim` comment.
```

---

## Stale-claim notice

> Posted when the weekly sweep finds no activity for 14 days (SOP Rule 4). The row
> moves to `stale` and the bounty reopens. Governance: OS Associate.

```markdown
Hi @handle — this claim has had no activity for 14 days, so I've marked it **stale** and reopened the bounty for other contributors.

You can still submit a PR. Just note that if another contributor now claims and submits a valid PR first, the [tiebreaker rules](https://github.com/HHS/simpler-grants-gov/blob/main/documentation/bounties/paid-contributor-TOS.md) apply. If you're actively working and just went quiet, reply here with a progress update and we'll sort it out.
```

---

## Extension granted

> One 7-day extension per claim, requires a substantive progress update (SOP Rule 5).
> Governance: OS Associate grants; OS Lead reviews denials on request.

```markdown
Thanks for the update, @handle — extension granted. Your claim is now active for 7 additional days. This is the one extension available per claim, so the 14-day activity expectation resumes after this. Looking forward to the PR!
```

---

## Extension denied

> Progress report was generic ("still working on it") rather than concrete work or a
> specific blocker (SOP Rule 5). Governance: OS Associate; OS Lead reviews on request.

```markdown
Thanks @handle. I'm not able to grant an extension on this one — an extension needs a concrete progress update describing what's done or a specific blocker you've hit, and I don't have enough here to act on.

Your original claim window still applies. If you can share specifics (commits, a branch, the exact thing blocking you) before it lapses, reply here and I'll reconsider. Otherwise the bounty will reopen when the window closes, and you're welcome to pick it back up then.
```

---

## Withdrawal confirmation

> Contributor commented `/withdraw` (SOP Rule, Part 2.4). Governance: OS Associate.

```markdown
Done — your claim is withdrawn and the bounty is open to other contributors again. No hard feelings, and thanks for letting us know rather than letting it go stale. You're welcome to claim this or any other bounty in the future. 🙌
```

---

## Eligibility decline — non-US-citizen

> PR is valid but the contributor is not a US citizen, or citizenship can't be
> confirmed (SOP Rule 9). **Private email.** The contribution, if merged, stays.
> Governance: OS Associate; OS Lead consulted on appeal.

```
Subject: Simpler Grants bounty program — about your contribution to #NNN

Hi <name>,

Thank you for your work on #NNN — it's genuinely appreciated, and your contribution stands on its own merits in the project.

I'm writing about the bounty payment specifically. During this pilot, program eligibility is limited to US citizens, a constraint of how the program is funded. Because of that, we're not able to issue the bounty payment for this contribution. This is not a reflection of the quality of your work, which we value.

If your contribution is merged, it remains part of the project and you keep full credit for it. If you believe this determination is mistaken, you can reply to this email within 14 days and we'll review it.

Thank you again for contributing to Simpler Grants.

— Simpler Grants Open Source Program
```

---

## Eligibility decline — HHS relationship

> Contributor is or was an employee/contractor/subcontractor or an HHS
> employee/contractor — a conflict of interest (SOP Rule 11). **Private email.**
> The contribution, if merged, stays; the claimed bounty is released to the pool.
> Governance: OS Associate identifies; OS Lead confirms.

```
Subject: Simpler Grants bounty program — about your contribution to #NNN

Hi <name>,

Thank you for contributing to #NNN. I'm following up about the bounty payment.

The program's Terms of Service exclude current and former HHS employees and contractors and subcontractors, from receiving bounty payments. This is a conflict-of-interest safeguard for a federally funded program, not a judgment of your work. Based on our records, that exclusion applies here, so we're unable to issue the bounty payment for this contribution.

Your contribution, if merged, remains in the project with full credit to you. If you think this is a mistake, reply within 14 days and we'll review.

Thank you for your work on Simpler Grants.

— Simpler Grants Open Source Program
```

---

## Eligibility decline — minor

> Operator has affirmative reason to believe the claimant is under 18 (SOP Rule 8).
> **Private email.** Keep it brief and respectful; do not collect further personal
> data. The contribution, if merged, stays. Governance: OS Associate identifies;
> OS Lead decides on decline; Delivery Lead consulted on ambiguous cases.

```
Subject: Simpler Grants bounty program — about your contribution to #NNN

Hi <name>,

Thank you for your contribution to #NNN.

The bounty program's Terms of Service require participants to be 18 or older, so we're not able to issue a bounty payment in this case. Your contribution, if merged, remains part of the project and you keep full credit for it — and we'd be glad to keep seeing your work in the repository.

If you believe this determination is mistaken, you or a parent or guardian can reply to this email and we'll follow up.

Thank you for contributing to Simpler Grants.

— Simpler Grants Open Source Program
```

---

## W-9 request email

> Triggered when a pending payment will push the contributor's calendar-year
> cumulative program payments to **$600 or more** (SOP Part 5.3, Rule 15). Payment
> is held until the W-9 is received; forfeited to the program reserve if not
> returned within 14 days. **Private email.** Governance: OS Associate.

```
Subject: Action needed — IRS Form W-9 to release your Simpler Grants bounty payment

Hi <name>,

Congratulations on your merged contribution to #NNN — the $AMOUNT bounty is approved and ready to pay.

One more step: with this payment, your total bounty payments from the program this calendar year will reach or exceed $600. US tax rules require us to collect an IRS Form W-9 before releasing a payment that crosses that threshold. (At year end, the Bounty Prgroam Administrator issues a Form 1099-NEC to any contributor paid $600 or more.)

Please complete and return a W-9 by <date — 14 days out>:
- Blank form and instructions: https://www.irs.gov/forms-pubs/about-form-w-9
- Return it securely via a google drive or drop-box link sent to <opensource@grants.gov>
Your payment is on hold until we receive the completed form. If it isn't returned within 14 days from the sending of this email, the payment is forfeited to the program reserve under the Terms of Service — though your contribution remains merged either way, and you can reach out anytime to sort it out.

Questions are welcome. Thanks for your work on Simpler Grants.

— Simpler Grants Open Source Program
```

---

## Tremendous handoff note

> Internal note to Bounty Prgroam Administrator finance to initiate payment, following Bounty Prgroam Administrator's existing
> Tremendous SOP (SOP Part 5.1). Target: submitted within 24h of merge, confirmed
> sent within 48h. **Not sent to the contributor.** Governance: OS Associate
> initiates; Bounty Prgroam Administrator finance processes.

```
Bounty payout request — Simpler Grants Funded OSS Contributor Program

Contributor email:   <payment email — verified against GitHub account>
Amount (USD):        $AMOUNT
Bounty issue:        <full issue URL>
Internal ref ID:     <tracker reference ID>

Verification (complete before submitting):
- [ ] PR merged; two maintainer approvals + acceptance-criteria PASS comment on file
- [ ] Identity / eligibility verified (citizenship, no HHS relationship, 18+)
- [ ] OFAC SDN screen clear (date + initials in tracker)
- [ ] W-9 on file if YTD cumulative ≥ $600, otherwise N/A
- [ ] Budget tracker reservation status = posted; sufficient envelope remaining

Attach the issue URL in the Tremendous internal note. After Tremendous confirms
"sent," record the payment ID and date in the budget tracker and flip the issue to
the paid banner + status:paid.
```

---

## Post-payout thank-you

> Public comment once the payment is confirmed sent and the issue
> is closed with the paid banner (SOP Part 2.6). Include the survey link.
> Governance: OS Associate.

```markdown
🎉 Paid! @handle, your $AMOUNT bounty for #NNN was sent via Tremendous on <date> — check the email on your GitHub account.

Thank you for contributing to Simpler Grants. Two quick things:
- [We'd love 2 minutes of your feedback on how this went](https://docs.google.com/forms/d/e/1FAIpQLSe0r5sFEXpWL6HxglPAEkj9s4ktMELJ3pi6m_BCntZ_7ucpKA/viewform?usp=dialog)
- This isn't a one-time thing — browse the [open bounties](README.md#bounty-board) anytime, and unpaid contributions are just as welcome.

Hope to see you on the next one. 🙌
```