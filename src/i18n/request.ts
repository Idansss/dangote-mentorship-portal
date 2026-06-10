import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, isAppLocale, LOCALE_COOKIE } from './config';

// next-intl WITHOUT i18n routing: the active locale comes from a cookie so the
// app has no /[locale] URL segment and middleware stays dedicated to auth.
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
