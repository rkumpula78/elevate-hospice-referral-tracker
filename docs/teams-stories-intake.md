# Share a Story from Microsoft Teams

This lets staff submit patient stories from a form inside a Teams channel. The
form answers flow into the CRM's **Stories → Review Queue**, where an admin can
review and publish them to the Story Library.

```
Microsoft Form (shared in Teams)
        │  (on submit)
        ▼
Power Automate flow  ──HTTP POST──▶  Supabase edge function  ──▶  story_submissions
                                     (story-intake)                      │
                                                                         ▼
                                                          CRM Stories → Review Queue
```

## 1. Create the Microsoft Form

In Microsoft Forms (or a Form added to a Teams channel tab), create these
questions. Keep the answer keys handy for the Power Automate mapping:

- **Your name or email** (required) → `submitted_by`
- **Your role** (optional) → `submitted_by_role`
- **Type of submission** (choice: Patient Story / Family Feedback / Content Idea)
  → `submission_type` (`patient_story` | `family_feedback` | `content_idea`)
- **Patient alias / nickname** (optional) → `patient_alias`
- **The story** (long text) → `story_notes`
- **A short quote we could use** (optional) → `suggested_quote`
- **Do you have consent to share?** (yes/no) → `consent_obtained`

## 2. Set the shared secret

Pick a long random string and add it to the edge function secrets in Supabase:

```
STORY_INTAKE_SECRET=<your-long-random-string>
```

(Also ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present — they
are by default.)

Deploy the function:

```
supabase functions deploy story-intake
```

The endpoint will be:

```
https://<your-project-ref>.supabase.co/functions/v1/story-intake
```

## 3. Build the Power Automate flow

1. Trigger: **When a new response is submitted** (Microsoft Forms) → pick your form.
2. Action: **Get response details** → pick the form + the response id.
3. Action: **HTTP** (or "HTTP with Microsoft Entra ID" is NOT needed):
   - Method: `POST`
   - URI: the `story-intake` URL above
   - Headers:
     - `Content-Type`: `application/json`
     - `x-intake-secret`: the same value as `STORY_INTAKE_SECRET`
   - Body (map the dynamic form fields):

```json
{
  "submitted_by": "@{outputs('Get_response_details')?['body/<name-field-id>']}",
  "submitted_by_role": "@{outputs('Get_response_details')?['body/<role-field-id>']}",
  "submission_type": "patient_story",
  "patient_alias": "@{outputs('Get_response_details')?['body/<alias-field-id>']}",
  "story_notes": "@{outputs('Get_response_details')?['body/<story-field-id>']}",
  "suggested_quote": "@{outputs('Get_response_details')?['body/<quote-field-id>']}",
  "consent_obtained": "@{outputs('Get_response_details')?['body/<consent-field-id>']}"
}
```

Notes:
- `submitted_by` is the only required field; the function rejects requests without it.
- `submission_type` must be one of `patient_story`, `family_feedback`, `content_idea` (defaults to `patient_story` if blank/invalid).
- `consent_obtained` accepts `true`/`false` (string or boolean).

## 4. Review submissions in the CRM

Go to **Stories → Review Queue**. New Teams submissions appear with status
`new`. From there an admin promotes a submission into a published story exactly
as with in-app submissions — no extra steps.

## Security notes

- The endpoint runs with `verify_jwt = false` and is protected by the
  `x-intake-secret` shared secret. Rotate the secret if it leaks.
- The function uses the service role only to insert into `story_submissions`; it
  does not read or expose any other data.
