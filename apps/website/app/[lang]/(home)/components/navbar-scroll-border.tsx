"use client";

import { useEffect } from "react";

/**
 * Toggles a `data-scrolled` attribute on <body> while the homepage is mounted.
 * Combined with the `data-home-page` marker on the home layout, CSS keeps the
 * navbar border-b transparent at the top of the page and reveals it on scroll.
 */
export const NavbarScrollBorder = () => {
  useEffect(() => {
    const { body } = document;

    const syncScrolled = () => {
      if (window.scrollY > 0) {
        body.setAttribute("data-scrolled", "");
      } else {
        body.removeAttribute("data-scrolled");
      }
    };

    syncScrolled();
    window.addEventListener("scroll", syncScrolled, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncScrolled);
      body.removeAttribute("data-scrolled");
    };
  }, []);

  return null;
};
