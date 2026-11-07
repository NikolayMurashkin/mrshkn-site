import { createContext } from 'react';
import type { TermScopeValue } from './types';

export const TermScopeContext = createContext<TermScopeValue | null>(null);
