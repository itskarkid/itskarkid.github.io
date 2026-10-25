---
title: Second Thought
folder: responsible-ai
stage: budding
confidence: high
created: 2026-10-25
lastTended: 2026-10-25
tags:
  - responsible-ai
publish: true
---
Second thought started during Synoptix Hackathon Responsible AI Hackathon 2026 from a question:

> [!note] Question
> How can we protect personal information leak in an LLM prompts while preserving enough context for the model to remain useful?

When interaction with an LLM, user may unintentionally include information such as names, addresses, account number, email address or financial details in their prompts. Removing all of this information can improve privacy, but it can also remove context that the model needs to understand the request.

Second Thought explore a privacy layer that sits between the user and an LLM. Its purpose is not simply to remove information, but to help the user what should leave their device while preserving the meaning of the original prompt.

## Core Idea

Instead of sending he original prompt to an LLM, Second Thought first analyses it for potentially sensitive information.

The user can then replace selected information with contextual placeholder such as:
```
[private_address]
[account_number]
[person_name]
```
The mask prompt is sent to the LLM rather than the original text.

When the LLM returns its response , Second Thought processes the response locally and restore the placeholders with the original values before displaying it to the user.

The intended flow is:

![[second-thought-masking.png]]
The external model therefore receives enough information to understand the structure and meaning of the request without necessarily receiving the underlying personal values.

## Privacy Detection Approaches

Second Thought is an idea for introducing a privacy layer between the user and an LLM. Rather than depending on a single method, I explored several possible approaches for identifying and protecting personal information.
### Manual Masking

One approach is to let the user decide directly what should be hidden. In a private interaction mode, the user could select words or phrases and mask or unmask them before sending the prompt. 

This provides the most direct form of user control, although it also depends on the user noticing all sensitive information themselves.

### Rule-Based Detection

Another approach is to use rules or regular expressions to highlight patterns that are commonly associated with sensitive information. Examples include email addresses, phone numbers, account identifiers and other structured values.

This can help draw the user's attention to information they might otherwise overlook, but rule-based detection is limited when personal information does not follow a predictable format.

### Local Privacy Detection

A more flexible approach is to use a locally running privacy-detection model to identify potentially sensitive information from the meaning and context of the prompt. Instead of automatically removing the detected information, the model could highlight it for the user to review.

The user would still decide what should be masked, what should remain visible, and whether anything else needs to be hidden.

### Combining the Approaches

These approaches do not necessarily need to compete with one another. A possible Second Thought workflow could combine them:

`Rule-based detection + local model suggestions + manual user control`

Rules could detect obvious patterns, a local model could identify less structured personal information, and the user could make the final decision.

This keeps Second Thought centered on the idea of **assisted privacy rather than automatic censorship**.

## Human in the Loop

A central idea behind Second Thought is **human-in-the-loop privacy**. Privacy can depend heavily on context. Information that one user considers sensitive may be acceptable for another user to share. 

For this reason, the privacy detector acts as an assistant rather than the final decision maker.

The system effectively asks:

> **“This information might be sensitive. Do you still want to send it?”**

The final decision remains with the user.

This also provides the idea behind the name **Second Thought** — giving the user a second opportunity to consider the information they are about to share.

## Preserving Context

Simply replacing every sensitive value with `[MASKED]` can remove useful semantic information.

Instead, Second Thought explores **context-preserving masking**.

For example:

**Original**

`My account number is ACC-99281-UK and I live at 42 Elmwood Road, Bristol, BS8 4TR.`

**Masked**

`My account number is [account_number] and I live at [private_address].`

The LLM no longer knows the actual account number or address, but it still understands that the request involves an account number and a residential address.

This distinction can be important when generating useful responses.

## Restoring the Response

Protecting the outgoing prompt creates another usability problem. If the LLM receives placeholders, its response may also contain those placeholders.

For example, the LLM might return:

`Please include your [account_number] and [private_address] in the email.`

Displaying this directly to the user would protect privacy, but it would also result in an incomplete and unnatural interaction.

Second Thought therefore also considers the **return path**.

The privacy layer maintains the mapping between the original values and their placeholders locally.

For example:

`[account_number] → ACC-99281-UK`

`[private_address] → 42 Elmwood Road, Bristol, BS8 4TR`

When the LLM response is received, Second Thought resolves the placeholders locally.

**Response received from the LLM**

`Please include your account number [account_number] and address [private_address].`

**Response shown to the user**

`Please include your account number ACC-99281-UK and address 42 Elmwood Road, Bristol, BS8 4TR.`

The sensitive information therefore does not need to be exposed to the external model, while the user can still receive a natural and complete response.

## A Simple Example

Consider this request: 

**Original prompt**

`Hi, I was double-charged on my electricity bill for my flat at 42 Elmwood Road, Bristol, BS8 4TR. My account number is ACC-99281-UK under the name Marcus Albright. I paid via my debit card ending in 4128, but my statement shows two identical charges of £84.50 on 12 October 2026. Draft an email for me.`

A masked version could be:

`Hi, I was double-charged on my electricity bill for my flat at [private_address]. My account number is [account_number] under the name Marcus Albright. I paid via my debit card ending in [card_number], but my statement shows two identical charges of £[payment_amount] on 12 October 2026. Draft an email for me.`

**Llama 3.2 3B** model response

```
Here's a draft email you can use as a template:

Subject: Dispute of Double Charge on Electricity Bill

Dear [Electricity Provider's Customer Service Team],

I am writing to dispute a double charge on my electricity bill for my flat at [private_address]. According to my account number [account_number], I was charged two identical amounts of £[MASKED] on 12 October 2026.

I have checked my payment record and confirmed that I paid my electricity bill via my debit card ending in [MASKED] on the same date. I am unsure how the double charge occurred and would like to request that you investigate this matter further.

Could you please look into this dispute and take the necessary steps to correct the error? I would appreciate it if you could also provide me with an explanation for the double charge and any subsequent actions you will take to prevent such occurrences in the future.

My account details are as follows:

* Account Number: [account_number]
* Name: Marcus Albright

Please let me know if there is any further information you need from me to resolve this issue. I can be reached at [your email address or phone number] if you require any additional details.

Thank you for your attention to this matter.

Sincerely,

Marcus Albright
```

The model still understands that the request involves an electricity bill, an account, a payment card and a duplicated transaction.

It does not need the original values to draft the email. You can have prototype version of [second-thought](https://github.com/itskarkid/second-thought).
## Privacy vs Utility

Second Thought therefore leads to a broader question:

> **How much personal information can we remove from a prompt while still preserving enough context for an LLM to produce a useful response?**

- Masking too little provides weak privacy.
- Masking too much may prevent the model from understanding the request.

The interesting problem lies somewhere between the two.

