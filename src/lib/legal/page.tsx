import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { LEGAL_DOCUMENTS, LEGAL_LOCALE } from './consts';
import { parseLegalDocument } from './parse';
import type { LegalDocumentId, LegalHistory, LegalRouteParams } from './types';

/** Язык страницы документа; документов нет на английском → на `/en/…` страница 404. */
const legalLocale = async (params: LegalRouteParams) => {
  const { locale } = await params;

  if (locale !== LEGAL_LOCALE) {
    notFound();
  }

  return LEGAL_LOCALE;
};

/**
 * Текст документа из копии юрпакета. Каталог в пути — литералом: по нему сборка кладет в образ только
 * `content/legal/`, а не весь проект (плюс `outputFileTracingIncludes` в `next.config.ts`).
 */
const readLegalDocument = async (id: LegalDocumentId) => {
  const source = await readFile(path.join(process.cwd(), 'content', 'legal', LEGAL_DOCUMENTS[id].file), 'utf8');
  const blocks = parseLegalDocument(source);
  const title = blocks.find((block) => block.type === 'title');

  if (!title) {
    throw new Error(`content/legal/${LEGAL_DOCUMENTS[id].file}: нет заголовка документа`);
  }

  return { title: title.text, blocks: blocks.filter((block) => block !== title) };
};

export const legalPageMetadata = async (id: LegalDocumentId, params: LegalRouteParams): Promise<Metadata> => {
  const locale = await legalLocale(params);
  const { href, messages } = LEGAL_DOCUMENTS[id];
  const t = await getTranslations({ locale, namespace: `${messages}.meta` });

  return pageMetadata({
    locale,
    path: href,
    title: t('title'),
    description: t('description'),
    locales: [LEGAL_LOCALE],
  });
};

export const legalOgTexts = async (id: LegalDocumentId) => {
  const t = await getTranslations({ locale: LEGAL_LOCALE, namespace: `${LEGAL_DOCUMENTS[id].messages}.meta` });

  return { title: t('title'), description: t('description') };
};

/** Страница документа: текст из юрпакета в верстке страницы политики направления, без оглавления. */
export const renderLegalPage = async (id: LegalDocumentId, params: LegalRouteParams) => {
  const locale = await legalLocale(params);
  setRequestLocale(locale);

  const [design, document, t] = await Promise.all([
    getDesign(),
    readLegalDocument(id),
    getTranslations({ locale, namespace: 'docs' }),
  ]);
  const history: LegalHistory | undefined = LEGAL_DOCUMENTS[id].history
    ? { title: t('history.title'), text: t('history.empty') }
    : undefined;

  return (
    <main>
      <DesignSection
        design={design}
        section="legalPage"
        kicker={t('kicker')}
        title={document.title}
        blocks={document.blocks}
        history={history}
      />
    </main>
  );
};
