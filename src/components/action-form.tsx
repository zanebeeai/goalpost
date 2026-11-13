"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type SubmitEvent,
} from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FormState = { ok?: boolean; error?: string; message?: string };
type Action<S extends FormState> = (prev: S, formData: FormData) => Promise<S>;

type FormContextValue = {
  pending: boolean;
  /** The `value` of the button that submitted the form, if any. */
  submitter: string | null;
  /** True after a successful save, until the user edits again. */
  saved: boolean;
  /** The error to show right now, if any. */
  error: string | null;
  /** Id of the element that shows `error`, for aria-describedby. */
  errorId: string;
  /** Which field the error is about: a field name, "all", or null for none. */
  errorField: string | null;
};

const FormContext = createContext<FormContextValue | null>(null);

const EMPTY_CONTEXT: FormContextValue = {
  pending: false,
  submitter: null,
  saved: false,
  error: null,
  errorId: "",
  errorField: null,
};

export function useActionForm(): FormContextValue {
  return useContext(FormContext) ?? EMPTY_CONTEXT;
}

/** Props that tie a field to its form's error message, when it is about it. */
export function useFieldErrorProps(name?: string) {
  const context = useContext(FormContext);
  if (!context?.error) return {};
  if (context.errorField !== "all" && context.errorField !== name) return {};
  return {
    "aria-invalid": true as const,
    "aria-describedby": context.errorId,
  };
}

/**
 * A form bound to a server action with inline pending, error and "Saved" states.
 * Submissions go through `onSubmit` so React does not reset the fields when an
 * action fails; before hydration the native `action` still works.
 *
 * The error shows at the end of the form unless `errorInline` is set, in which
 * case the children place a `<FieldError />` right under the field.
 */
export function ActionForm<S extends FormState>({
  action,
  children,
  className,
  resetOnSuccess = false,
  onSuccess,
  validate,
  errorInline = false,
  errorFieldFor,
  noValidate = false,
  "aria-label": ariaLabel,
}: {
  action: Action<S>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
  /** Return a message to block the submit and show it as the error. */
  validate?: (formData: FormData) => string | null;
  errorInline?: boolean;
  /**
   * The field name an error is about, so only that field is marked invalid;
   * null marks none (for example a limit). By default every field is marked.
   */
  errorFieldFor?: (error: string) => string | null;
  /** Skip the browser's own validation bubbles; `validate` speaks instead. */
  noValidate?: boolean;
  "aria-label"?: string;
}) {
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  // onSuccess runs from the action itself, not from an effect: revalidation
  // can unmount this form (for example notes switching to read-only) before
  // an effect would ever run. Forms without onSuccess keep the bare server
  // action so they still submit before hydration.
  const actionWithSuccess = useCallback(
    async (prev: S, formData: FormData): Promise<S> => {
      const result = await action(prev, formData);
      if (result.ok) startTransition(() => onSuccessRef.current?.());
      return result;
    },
    [action],
  );
  const [state, formAction, pending] = useActionState<S, FormData>(
    onSuccess ? actionWithSuccess : action,
    {} as Awaited<S>,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const errorId = useId();
  const [submitter, setSubmitter] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const button = event.nativeEvent.submitter;
    const formData = new FormData(event.currentTarget, button);
    const problem = validate?.(formData) ?? null;
    setLocalError(problem);
    setDirty(false);
    if (problem) return;
    setSubmitter(button?.getAttribute("value") ?? null);
    startTransition(() => formAction(formData));
  }

  const error =
    localError ?? (!dirty && !pending ? (state.error ?? null) : null);
  const saved = Boolean(state.ok) && !dirty && !pending && !localError;
  const errorField = error
    ? errorFieldFor
      ? errorFieldFor(error)
      : "all"
    : null;

  return (
    <FormContext.Provider
      value={{ pending, submitter, saved, error, errorId, errorField }}
    >
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        onInput={() => {
          setDirty(true);
          setLocalError(null);
        }}
        className={className}
        aria-label={ariaLabel}
        noValidate={noValidate}
      >
        {children}
        {errorInline ? null : <FieldError />}
        {state.message ? <FormNote>{state.message}</FormNote> : null}
      </form>
    </FormContext.Provider>
  );
}

/** The form's current error, placed wherever it reads best. */
export function FieldError({ className }: { className?: string }) {
  const { error, errorId } = useActionForm();
  if (!error) return null;
  return (
    <FormError id={errorId} className={className}>
      {error}
    </FormError>
  );
}

export function FormError({
  children,
  id,
  className,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <p
      id={id}
      role="alert"
      className={cn("mt-2 text-sm font-medium text-clay-ink", className)}
    >
      {children}
    </p>
  );
}

export function FormNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="mt-3 rounded-xl bg-moss-100/60 px-3.5 py-3 text-sm text-forest-900"
    >
      {children}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  savedLabel,
  value,
  className,
  ...props
}: Omit<ButtonProps, "type"> & {
  pendingLabel?: string;
  /** Shown in place of the label after a successful save. */
  savedLabel?: string;
}) {
  const { pending, submitter, saved } = useActionForm();
  const isMine =
    pending && (value === undefined || String(value) === submitter);
  const showSaved = Boolean(savedLabel) && saved;
  return (
    <Button
      {...props}
      type="submit"
      value={value}
      disabled={pending || props.disabled}
      aria-busy={isMine || undefined}
      className={className}
    >
      {isMine ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden />
          {pendingLabel ?? children}
        </>
      ) : showSaved ? (
        <>
          <Check aria-hidden />
          <span role="status">{savedLabel}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** A quiet confirmation that appears after a successful save. */
export function SavedHint({
  className,
  children = "Saved",
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { saved } = useActionForm();
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-forest-500 transition-opacity duration-300",
        saved ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {saved ? (
        <>
          <Check className="size-4" aria-hidden />
          {children}
        </>
      ) : null}
    </span>
  );
}
