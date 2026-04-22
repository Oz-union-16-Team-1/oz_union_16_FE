const isNonEmptyMessage = (value?: string) => Boolean(value?.trim());

export const getFirstErrorFieldName = <FieldName extends string>(
  fieldErrors: Partial<Record<FieldName, string>>,
  fieldOrder: readonly FieldName[],
): FieldName | null => {
  for (const fieldName of fieldOrder) {
    if (isNonEmptyMessage(fieldErrors[fieldName])) {
      return fieldName;
    }
  }

  return null;
};

export const focusFieldByName = <FieldName extends string>(
  fieldName: FieldName | null,
  fieldElementIdMap: Partial<Record<FieldName, string>>,
) => {
  if (!fieldName || typeof window === 'undefined') {
    return;
  }

  const elementId = fieldElementIdMap[fieldName];

  if (!elementId) {
    return;
  }

  window.requestAnimationFrame(() => {
    const targetElement = document.getElementById(elementId);

    if (targetElement instanceof HTMLElement) {
      targetElement.focus();
    }
  });
};
