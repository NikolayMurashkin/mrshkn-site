import Script from 'next/script';
import { GA_ID_PATTERN, GTAG_SRC, METRIKA_ID_PATTERN, METRIKA_OPTIONS, METRIKA_TAG_SRC } from '@/lib/analytics/consts';
import type { AnalyticsScriptsProps } from './types';

const metrikaCode = (id: string) =>
  [
    '(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();',
    'for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}',
    'k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})',
    `(window,document,'script',${JSON.stringify(METRIKA_TAG_SRC)},'ym');`,
    `ym(${Number(id)},'init',${JSON.stringify(METRIKA_OPTIONS)});`,
  ].join('');

const gtagCode = (id: string) =>
  [
    'window.dataLayer=window.dataLayer||[];',
    'window.gtag=function(){window.dataLayer.push(arguments);};',
    "window.gtag('js',new Date());",
    `window.gtag('config',${JSON.stringify(id)});`,
  ].join('');

/** Счетчики Метрики и GA4: без согласия и без ID не рисует ничего, до согласия браузер не идет к ним ни разу. */
export const AnalyticsScripts = ({ consent, metrikaId, gaId }: AnalyticsScriptsProps) => {
  if (!consent) {
    return null;
  }

  const metrika = metrikaId && METRIKA_ID_PATTERN.test(metrikaId) ? metrikaId : null;
  const ga = gaId && GA_ID_PATTERN.test(gaId) ? gaId : null;

  if (!metrika && !ga) {
    return null;
  }

  return (
    <>
      {metrika ? (
        <Script
          id="metrika-init"
          strategy="afterInteractive"
        >
          {metrikaCode(metrika)}
        </Script>
      ) : null}
      {ga ? (
        <>
          <Script
            id="gtag-src"
            src={`${GTAG_SRC}?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script
            id="gtag-init"
            strategy="afterInteractive"
          >
            {gtagCode(ga)}
          </Script>
        </>
      ) : null}
    </>
  );
};
