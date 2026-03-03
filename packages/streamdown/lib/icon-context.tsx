"use client";

import { createContext, type SVGProps, useContext, useRef } from "react";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Loader2Icon,
  Maximize2Icon,
  RotateCcwIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./icons";

export type IconComponent = React.ComponentType<
  SVGProps<SVGSVGElement> & { size?: number }
>;

export interface IconMap {
  CheckIcon: IconComponent;
  CopyIcon: IconComponent;
  DownloadIcon: IconComponent;
  ExternalLinkIcon: IconComponent;
  Loader2Icon: IconComponent;
  Maximize2Icon: IconComponent;
  RotateCcwIcon: IconComponent;
  XIcon: IconComponent;
  ZoomInIcon: IconComponent;
  ZoomOutIcon: IconComponent;
}

export const defaultIcons: IconMap = {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Loader2Icon,
  Maximize2Icon,
  RotateCcwIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
};

export const IconContext = createContext<IconMap>(defaultIcons);

const shallowEqual = (
  a?: Partial<IconMap>,
  b?: Partial<IconMap>
): boolean => {
  if (a === b) return true;
  if (!a || !b) return a === b;
  const keysA = Object.keys(a) as (keyof IconMap)[];
  const keysB = Object.keys(b) as (keyof IconMap)[];
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]);
};

export const IconProvider = ({
  icons,
  children,
}: {
  icons?: Partial<IconMap>;
  children: React.ReactNode;
}) => {
  const prevIconsRef = useRef(icons);
  const prevValueRef = useRef<IconMap>(
    icons ? { ...defaultIcons, ...icons } : defaultIcons
  );

  if (!shallowEqual(prevIconsRef.current, icons)) {
    prevIconsRef.current = icons;
    prevValueRef.current = icons
      ? { ...defaultIcons, ...icons }
      : defaultIcons;
  }

  const value = prevValueRef.current;

  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
};

export const useIcons = () => useContext(IconContext);
