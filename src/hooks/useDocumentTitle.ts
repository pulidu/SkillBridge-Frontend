import { useEffect } from 'react';

const BASE_TITLE = 'SkillBridge LMS';

/** Keeps the browser tab title in step with the active screen. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;
  }, [title]);
}
