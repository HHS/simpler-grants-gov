# Paid banner (SOP Part 2.6)

When a bounty is paid out, **replace the bounty banner at the top of the issue
description** with the banner below, then close the issue and apply the
`status:paid` label. This is the permanent record that the issue is closed to
further paid submissions.

## Drop-in

```markdown
> 💰 **Bounty PAID — $AMOUNT to @handle on <date>.**
>
> No further submissions will be accepted for payment on this issue.
> Thank you to all who claimed and contributed.
```

## Example

```markdown
> 💰 **Bounty PAID — $500 to @contributor on 2026-04-25.**
>
> No further submissions will be accepted for payment on this issue.
> Thank you to all who claimed and contributed.
```

## Closure checklist (Part 2.6 exit criteria)

- [ ] Tremendous payment **confirmed sent** (not just submitted).
- [ ] Budget tracker row closed with the payment ID.
- [ ] Tracking table row set to `paid`; all other open rows set to `declined`.
- [ ] `status:paid` label applied; bounty banner swapped for the paid banner above.
- [ ] Issue closed.
- [ ] Post-payout survey sent (see [operator replies](./operator-replies.md#post-payout-thank-you)).