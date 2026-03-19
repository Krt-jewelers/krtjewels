import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

function getSessionId(): string {
  let sid = sessionStorage.getItem('analytics_sid');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('analytics_sid', sid);
  }
  return sid;
}

export function usePageViewTracker() {
  const location = useLocation();
  const lastPath = useRef('');

  useEffect(() => {
    const path = location.pathname + location.search;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const sessionId = getSessionId();

    supabase.from('page_views').insert({
      page_path: location.pathname,
      page_title: document.title,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: sessionId,
    } as any).then(() => {});
  }, [location.pathname, location.search]);
}

export async function logSearch(query: string, resultsCount: number) {
  if (!query.trim()) return;
  await supabase.from('search_logs').insert({
    query: query.trim().toLowerCase(),
    results_count: resultsCount,
  } as any);
}
