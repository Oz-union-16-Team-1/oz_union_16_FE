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
    'mt-1.5 h-12 w-full rounded-2xl text-sm/6 sm:mt-2 sm:h-[3.2rem] sm:text-base/6',
  auxiliaryLink:
    'text-login-muted text-sm font-medium transition-colors hover:text-white/80',
  footerSection: 'border-login-divider mt-3 border-t pt-3 sm:mt-4 sm:pt-4',
  footerHelperText: 'text-login-helper text-center text-sm/5 font-normal',
  footerLinkButton:
    'mt-2.5 h-12 w-full border-white/18 bg-[linear-gradient(180deg,rgba(46,47,54,0.92)_0%,rgba(31,32,38,0.96)_100%)] text-sm/6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_30px_rgba(0,0,0,0.22)] hover:border-[#ff6b6e]/50 hover:bg-[linear-gradient(180deg,rgba(57,41,45,0.96)_0%,rgba(39,25,29,0.98)_100%)] sm:h-[3.2rem] sm:text-base/6',
} as const;
