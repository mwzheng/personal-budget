"use client";

/**
 * Note 1: The page itself stays server-rendered for fast content delivery, while
 * this component owns the interactive validation and submission lifecycle.
 */

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChangeEvent, FormEvent, useState } from "react";

import {
  ContactSubmissionSchema,
  type ContactSubmission,
} from "@/lib/schemas/schemas";
import type { ContactFormContent } from "@/lib/types/content";

const CONTACT_FIELD_NAMES = ["name", "email", "subject", "message"] as const;

type ContactFieldName = (typeof CONTACT_FIELD_NAMES)[number];
type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;
type ContactFormStatus = {
  severity: "success" | "error";
  message: string;
} | null;

const INITIAL_FORM_VALUES: ContactSubmission = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

function normalizeFieldErrors(fieldErrors: unknown): ContactFieldErrors {
  const nextErrors: ContactFieldErrors = {};

  if (!fieldErrors || typeof fieldErrors !== "object") {
    return nextErrors;
  }

  for (const fieldName of CONTACT_FIELD_NAMES) {
    const rawValue = (fieldErrors as Record<string, unknown>)[fieldName];

    if (typeof rawValue === "string" && rawValue) {
      nextErrors[fieldName] = rawValue;
      continue;
    }

    if (Array.isArray(rawValue) && typeof rawValue[0] === "string") {
      nextErrors[fieldName] = rawValue[0];
    }
  }

  return nextErrors;
}

export function ContactForm({ form }: { form: ContactFormContent }) {
  const [values, setValues] = useState<ContactSubmission>(INITIAL_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<ContactFormStatus>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange =
    (fieldName: ContactFieldName) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;

      setValues((currentValues) => ({
        ...currentValues,
        [fieldName]: nextValue,
      }));

      setFieldErrors((currentErrors) => {
        if (!currentErrors[fieldName]) {
          return currentErrors;
        }

        const nextErrors = { ...currentErrors };
        delete nextErrors[fieldName];
        return nextErrors;
      });

      if (status) {
        setStatus(null);
      }
    };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    // Note 2: Running the shared Zod schema in the browser keeps the form snappy
    // for users while guaranteeing the API enforces the exact same rules.
    const parseResult = ContactSubmissionSchema.safeParse(values);

    if (!parseResult.success) {
      setFieldErrors(
        normalizeFieldErrors(parseResult.error.flatten().fieldErrors),
      );
      setStatus({
        severity: "error",
        message: form.validationMessage,
      });
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseResult.data),
      });

      const data = (await response.json().catch(() => null)) as {
        message?: string;
        fieldErrors?: unknown;
      } | null;

      if (!response.ok) {
        const nextErrors = normalizeFieldErrors(data?.fieldErrors);

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
        }

        setStatus({
          severity: "error",
          message:
            typeof data?.message === "string" && data.message.length > 0
              ? data.message
              : form.errorMessage,
        });
        return;
      }

      setValues(INITIAL_FORM_VALUES);
      setStatus({
        severity: "success",
        message:
          typeof data?.message === "string" && data.message.length > 0
            ? data.message
            : form.successMessage,
      });
    } catch {
      setStatus({
        severity: "error",
        message: form.errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ p: { xs: 3, md: 4 }, height: "100%" }}>
        <Stack
          component="form"
          noValidate
          spacing={2.5}
          onSubmit={handleSubmit}
          sx={{ height: "100%" }}
        >
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h4" fontWeight={700}>
              {form.title}
            </Typography>
            <Typography color="text.secondary">{form.description}</Typography>
          </Stack>

          {status ? (
            <Alert severity={status.severity} aria-live="polite">
              {status.message}
            </Alert>
          ) : null}

          <TextField
            required
            fullWidth
            label={form.fields.name.label}
            autoComplete={form.fields.name.autoComplete}
            value={values.name}
            onChange={handleFieldChange("name")}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name ?? form.fields.name.helperText}
            disabled={submitting}
          />

          <TextField
            required
            fullWidth
            type="email"
            label={form.fields.email.label}
            autoComplete={form.fields.email.autoComplete}
            value={values.email}
            onChange={handleFieldChange("email")}
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email ?? form.fields.email.helperText}
            disabled={submitting}
          />

          <TextField
            required
            fullWidth
            label={form.fields.subject.label}
            value={values.subject}
            onChange={handleFieldChange("subject")}
            error={Boolean(fieldErrors.subject)}
            helperText={fieldErrors.subject ?? form.fields.subject.helperText}
            disabled={submitting}
          />

          <TextField
            required
            fullWidth
            multiline
            minRows={6}
            label={form.fields.message.label}
            value={values.message}
            onChange={handleFieldChange("message")}
            error={Boolean(fieldErrors.message)}
            helperText={fieldErrors.message ?? form.fields.message.helperText}
            disabled={submitting}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
          >
            {submitting ? form.submittingLabel : form.submitLabel}
          </Button>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {form.privacyNote}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
