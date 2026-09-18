import { cookies } from 'next/headers';
import { DESIGN_COOKIE } from './consts';
import { resolveDesign } from './registry';
import type { DesignName } from './types';

export const getDesign = async (): Promise<DesignName> => resolveDesign((await cookies()).get(DESIGN_COOKIE)?.value);
