'use client';

import { createContext } from 'react';
import { NO_CONSENT } from './consts';
import type { ConsentState } from './types';

export const ConsentContext = createContext<ConsentState>(NO_CONSENT);
