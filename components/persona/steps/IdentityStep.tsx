"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { SingleSelect } from "@/components/ui/forms/SingleSelect";
import { TaxonomySelect } from "@/components/ui/forms/TaxonomySelect";
import { GENDER_OPTIONS } from "@/lib/personaOptions";

type IdentityData = {
  name?: string;
  ageGroup?: string | null;
  ageGroupId?: string | null;
  genderIdentity?: string | null;
  pronouns?: string | null;
};

export default function IdentityStep({
  data,
  setData,
  onValidityChange,
  showErrors,
}: {
  data: IdentityData;
  setData: (updater: (prev: IdentityData) => IdentityData) => void;
  onValidityChange?: (valid: boolean) => void;
  showErrors?: boolean;
}) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = React.useCallback((d: IdentityData) => {
    const e: Record<string, string> = {};
    if (!d.name?.trim()) e.name = "Name is required.";
    if (!d.ageGroupId) e.ageGroupId = "Age group is required.";
    if (!d.genderIdentity) e.genderIdentity = "Gender identity is required.";
    if (!d.pronouns?.trim()) e.pronouns = "Pronouns are required.";
    return e;
  }, []);

  React.useEffect(() => {
    const e = validate(data || {});
    setErrors(e);
    onValidityChange?.(Object.keys(e).length === 0);
  }, [data, onValidityChange, validate]);

  const show = (k: string) => !!showErrors && !!errors[k];

  const inputClass = (err: boolean) =>
    [
      "col-start-1 row-start-1 block w-full rounded-md bg-white px-3 py-2 pr-10 pl-3 text-base outline-1 -outline-offset-1 sm:text-sm",
      err
        ? "text-red-900 outline-red-300 placeholder:text-red-300 focus:outline-red-500 dark:text-red-200 dark:outline-red-900/50 dark:placeholder:text-red-400/70 dark:focus:outline-red-400"
        : "text-gray-900 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 dark:text-white dark:bg-gray-900 dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500",
    ].join(" ");

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Identity</h3>

        {/* Name */}
        
        <div className="flex items-center gap-3">
        <Avatar name={data?.name || "Persona"} size={56} />
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Name <span className="text-red-600">*</span>
          </label>
          <div className="mt-2 grid grid-cols-1">
            <input
              value={data?.name ?? ""}
              onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Dr. Eliza Moore"
              className={inputClass(show("name"))}
              aria-invalid={show("name")}
              aria-describedby={show("name") ? "name-error" : undefined}
            />
          </div>
          {show("name") && (
            <p id="name-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.name}
            </p>
          )}
        </div>
      </div>

      {/* Nickname (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">Nickname</label>
        <div className="mt-2 grid grid-cols-1">
          <input
            value={data?.nickname ?? ""}
            onChange={(e) => setData((p) => ({ ...p, nickname: e.target.value }))}
            placeholder="Optional"
            className={inputClass(false)}
          />
        </div>
      </div>
          
            <TaxonomySelect
            label="Age group"
            category="agegroup"
            valueId={data?.ageGroupId ?? null}
            onChangeId={(id) => setData((p) => ({ ...p, ageGroupId: id }))}
            required
            placeholder="Select…"
            error={show("ageGroupId") ? errors.ageGroupId : undefined}
          />

            <SingleSelect
              label={<>Gender identity <span className="text-red-600">*</span></>}
              placeholder="Select…"
              value={data?.genderIdentity ?? null}
              onChange={(v) => setData((p) => ({ ...p, genderIdentity: v }))}
              options={GENDER_OPTIONS}
              error={show("genderIdentity") ? errors.genderIdentity : undefined}
            />

          {/* Pronouns (required) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Pronouns <span className="text-red-600">*</span>
            </label>
            <div className="mt-2 grid grid-cols-1">
              <input
                value={data?.pronouns ?? ""}
                onChange={(e) => setData((p) => ({ ...p, pronouns: e.target.value }))}
                placeholder="e.g., she/her, he/him, they/them"
                className={inputClass(show("pronouns"))}
                aria-invalid={show("pronouns")}
                aria-describedby={show("pronouns") ? "pronouns-error" : undefined}
              />
            </div>
            {show("pronouns") && (
              <p id="pronouns-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.pronouns}
              </p>
            )}
          </div>
      </section>
    </div>
  );
}