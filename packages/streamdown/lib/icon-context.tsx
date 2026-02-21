"use client";

import { type SVGProps, createContext, useContext, useMemo } from "react";
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

export type IconComponent = React.ComponentType<SVGProps<SVGSVGElement>>;

export type IconMap = {
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
};

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

export const IconProvider = ({
  icons,
  children,
}: {
  icons?: Partial<IconMap>;
  children: React.ReactNode;
}) => {
  const value = useMemo(
    () => (icons ? { ...defaultIcons, ...icons } : defaultIcons),
    [icons],
  );
  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
};

export const useIcons = () => useContext(IconContext);
