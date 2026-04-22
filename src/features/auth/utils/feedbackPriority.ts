const hasText = (value?: string) => Boolean(value?.trim());
const isFieldErrorMessage = (value: unknown): value is string =>
  typeof value === 'string' && Boolean(value.trim());

export const hasAnyFieldError = <FieldName extends string>(
  fieldErrors: Partial<Record<FieldName, string>>,
) => Object.values(fieldErrors).some(isFieldErrorMessage);

export const resolveAuthFeedbackVisibility = <FieldName extends string>({
  fieldErrors,
  formMessage,
  hasToast,
}: {
  fieldErrors: Partial<Record<FieldName, string>>;
  formMessage?: string;
  hasToast?: boolean;
}) => {
  const hasFieldError = hasAnyFieldError(fieldErrors);
  const showFormMessage = !hasFieldError && hasText(formMessage);
  const showToast = !hasFieldError && !showFormMessage && Boolean(hasToast);

  return {
    hasFieldError,
    showFormMessage,
    showToast,
  };
};
