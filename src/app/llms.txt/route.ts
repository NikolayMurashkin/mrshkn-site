import { llmsText, textResponse } from '@/lib/seo/llms';
import { allLocaleMessages } from '@/lib/seo/messages';
import type { TextRoute } from '@/lib/seo/types';

export const dynamic = 'force-static';

export const GET: TextRoute = async () => textResponse(llmsText(await allLocaleMessages()));
