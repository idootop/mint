'use client';

import mediumZoom from 'medium-zoom';
import { useEffect } from 'react';

export const ImageZoom: any = () => {
  useEffect(() => {
    mediumZoom('[data-zoomable]');
  }, []);
};
