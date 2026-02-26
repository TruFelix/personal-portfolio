import { NextRequest } from 'next/server';

import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

const I18nMiddleware = createMiddleware({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  // urlMappingStrategy: 'rewrite'
})

export function proxy(request: NextRequest) {
  return I18nMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|tools|static|.*\\..*|_next|favicon.ico|robots.txt).*)']
}