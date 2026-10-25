/** A small check mark for confirmations, drawn inline so it costs no request. */
export function CheckMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-accent">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Form errors in the site's own style (design sweep F19): a short accent rule, full-contrast text. */
export const FORM_ERROR = "border-l-2 border-accent pl-3 font-ui text-sm leading-snug text-fg";
