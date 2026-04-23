export const AUTH_SHARED_LAYOUT_CLASS_NAMES = {
  panel: 'max-w-[560px] px-5 py-6 sm:px-9 sm:py-8',
  content: 'max-w-[428px]',
} as const;

export const AUTH_SHARED_FORM_CLASS_NAMES = {
  socialGroup: 'mt-4 sm:mt-5',
  divider: 'my-3 sm:my-4',
  form: 'space-y-2.5 sm:space-y-3',
  feedbackMessage: 'text-sm/5',
  submitButton:
    'mt-1.5 h-12 w-full text-sm/6 sm:mt-2 sm:h-[3.2rem] sm:text-base/6',
  auxiliaryLink:
    'text-login-muted text-sm font-medium transition-colors hover:text-white/80',
  footerSection: 'border-login-divider mt-3 border-t pt-3 sm:mt-4 sm:pt-4',
  footerHelperText: 'text-login-helper text-center text-sm/5 font-normal',
  footerLinkButton: 'mt-2.5 h-12 w-full text-sm/6 sm:h-[3.2rem] sm:text-base/6',
} as const;
