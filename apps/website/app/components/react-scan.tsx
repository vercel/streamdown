/** biome-ignore-all assist/source/organizeImports: <explanation> */
'use client';

import { scan } from 'react-scan/all-environments';
import { type JSX, useEffect } from 'react';

export function ReactScan(): JSX.Element {
  useEffect(() => {
    scan({
      enabled: true,
    });
  }, []);

  return <div />;
}
