import { newFieldId, type FormDef, type FormField } from "./form-schema";

const f = (p: Partial<FormField> & Pick<FormField, "type" | "label">): FormField => ({ id: newFieldId(), required: false, enabled: true, ...p });

export interface FormTemplate { id: string; name: string; description: string; build: () => Omit<FormDef, "version" | "createdAt" | "updatedAt"> }

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "blank",
    name: "Blank form",
    description: "Start empty and add exactly the fields you need.",
    build: () => ({ slug: "", title: "Untitled form", description: "", status: "draft", submitLabel: "Submit", successMessage: "Thank you! We have received your details.", consentText: "", fields: [] }),
  },
  {
    id: "enquiry",
    name: "Accommodation enquiry",
    description: "Name, phone, preferred locality (live from your Areas), room type and move-in date.",
    build: () => {
      const room = f({ type: "select", label: "Room type", optionsSource: "roomTypes", placeholder: "Any room type" });
      return {
        slug: "",
        title: "Find me a PG",
        description: "Tell us what you are looking for and a coordinator will call you back.",
        status: "draft",
        submitLabel: "Send enquiry",
        successMessage: "Thank you! Our team will call you back shortly.",
        consentText: "By sending this form you agree that we may contact you about PG availability.",
        fields: [
          f({ type: "section", label: "About you" }),
          f({ type: "text", label: "Full name", required: true, placeholder: "e.g. Riya Shah", minLength: 2 }),
          f({ type: "phone", label: "Mobile number", required: true, placeholder: "98XXXXXXXX" }),
          f({ type: "email", label: "Email", helpText: "We only use this to send you details." }),
          f({ type: "section", label: "What you need" }),
          f({ type: "radio", label: "Looking for", required: true, options: [{ label: "Boys PG", value: "boys" }, { label: "Girls PG", value: "girls" }] }),
          f({ type: "select", label: "Preferred locality", optionsSource: "areas", placeholder: "Any locality" }),
          room,
          f({ type: "date", label: "Planned move-in date", dateRule: "future" }),
          f({ type: "textarea", label: "Anything else?", maxLength: 500, placeholder: "Budget, food preferences, nearby college or office…" }),
        ],
      };
    },
  },
  {
    id: "visit",
    name: "Book a visit",
    description: "Visit date, preferred property and an optional ID upload.",
    build: () => ({
      slug: "",
      title: "Book a free visit",
      description: "Choose a property and a date. We will confirm the time by phone.",
      status: "draft",
      submitLabel: "Request visit",
      successMessage: "Visit requested. We will confirm the time by phone.",
      consentText: "",
      fields: [
        f({ type: "text", label: "Full name", required: true, minLength: 2 }),
        f({ type: "phone", label: "Mobile number", required: true }),
        f({ type: "select", label: "Property to visit", required: true, optionsSource: "properties" }),
        f({ type: "date", label: "Preferred visit date", required: true, dateRule: "future" }),
        f({ type: "radio", label: "Are you visiting with a parent or guardian?", options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }] }),
        f({ type: "text", label: "Guardian name", required: true, condition: null }),
        f({ type: "file", label: "Photo ID (optional)", accept: ["pdf", "jpg", "png"], maxSizeMB: 2, maxFiles: 1, helpText: "Speeds up check-in. Visible only to our staff." }),
      ],
    }),
  },
  {
    id: "feedback",
    name: "Resident feedback",
    description: "Rating, what went well, and permission to follow up.",
    build: () => ({
      slug: "",
      title: "Resident feedback",
      description: "Your feedback helps us improve every residence.",
      status: "draft",
      submitLabel: "Send feedback",
      successMessage: "Thank you for your feedback!",
      consentText: "",
      fields: [
        f({ type: "select", label: "Property", optionsSource: "properties", required: true }),
        f({ type: "radio", label: "Overall experience", required: true, options: [1, 2, 3, 4, 5].map((n) => ({ label: `${n} / 5`, value: String(n) })) }),
        f({ type: "checkboxes", label: "What did you like?", options: [{ label: "Food", value: "food" }, { label: "Cleanliness", value: "cleanliness" }, { label: "Safety", value: "safety" }, { label: "Wi-Fi", value: "wifi" }] }),
        f({ type: "textarea", label: "Comments", maxLength: 1000 }),
        f({ type: "checkbox", label: "You may contact me about this feedback" }),
      ],
    }),
  },
];

/** The visit template shows a guardian field only when the answer is "yes": wire the condition after ids exist. */
export function buildTemplate(id: string) {
  const t = FORM_TEMPLATES.find((x) => x.id === id) || FORM_TEMPLATES[0];
  const d = t.build();
  if (id === "visit") {
    const radio = d.fields.find((x) => x.type === "radio");
    const guardian = d.fields.find((x) => x.label === "Guardian name");
    if (radio && guardian) guardian.condition = { fieldId: radio.id, op: "equals", value: "yes" };
  }
  return d;
}
