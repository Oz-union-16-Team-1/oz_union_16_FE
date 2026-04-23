export const AUTH_SHARED_LAYOUT_CLASS_NAMES = {
  panel: 'max-w-[560px] px-5 py-6 sm:px-9 sm:py-9',
  content: 'max-w-[420px]',
} as const;

export const AUTH_SHARED_FORM_CLASS_NAMES = {
  socialGroup: 'mt-6 sm:mt-7',
  divider: 'my-5 sm:my-6',
  form: 'space-y-3 sm:space-y-3.5',
  feedbackMessage: 'text-sm/5',
  submitButton: 'mt-2 h-14 w-full text-base/6 sm:mt-2.5',
  auxiliaryLink:
    'text-login-muted text-sm font-medium transition-colors hover:text-white/80',
  footerSection: 'border-login-divider mt-4 border-t pt-4 sm:mt-5 sm:pt-5',
  footerHelperText: 'text-login-helper text-center text-sm/5 font-normal',
  footerLinkButton: 'mt-3 h-14 w-full text-base/6',
} as const;
