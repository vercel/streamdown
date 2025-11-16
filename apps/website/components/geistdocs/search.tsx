"use client";

import { useDocsSearch } from "fumadocs-core/search/client";
import {
  SearchDialog as FumadocsSearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";

export const SearchDialog = (props: SharedProps) => {
  const { locale } = useI18n();
  const { search, setSearch, query } = useDocsSearch({
    type: "fetch",
    locale,
  });

  return (
    <FumadocsSearchDialog
      isLoading={query.isLoading}
      onSearchChange={setSearch}
      search={search}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== "empty" ? query.data : null} />
      </SearchDialogContent>
    </FumadocsSearchDialog>
  );
};

export const SearchButton = () => {
  const { setOpenSearch } = useSearchContext();

  return (
    <Button
      className="gap-8 pr-1.5 font-normal text-muted-foreground shadow-none"
      onClick={() => setOpenSearch(true)}
      size="sm"
      type="button"
      variant="outline"
    >
      <span>Search...</span>
      <Kbd className="border bg-background font-medium">⌘K</Kbd>
    </Button>
  );
};
