"use client";

import {
  Bars3BottomLeftIcon,
  DocumentTextIcon,
  HashtagIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import {
  Box,
  Button,
  Container,
  Divider,
  Grow,
  Modal,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
import { SimpleTreeView } from "@mui/x-tree-view";
import React from "react";
import TreeItem from "../tree-item";
import {
  newDoc,
  SearchResult,
  type SearchIndex,
  type SerializedIndex,
} from "./common";

export type SearchClientProps = {
  defaultSuggestions: SearchResult[];
};

export default function SearchClient(props: SearchClientProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const openModal = React.useCallback(() => {
    setOpen(true);
    setQuery("");
  }, []);

  /* Open search bar on Ctrl+K or Command+K */
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        openModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openModal]);

  return (
    <>
      <Stack
        spacing={1}
        borderRadius="var(--shape-borderRadius)"
        border="1px solid var(--palette-divider)"
        paddingX={1}
        justifyContent="center"
        alignItems="center"
        direction="row"
        color="var(--palette-text-secondary)"
        display={{ xs: "none", sm: "flex" }}
        onClick={() => {
          setOpen(true);
          setQuery("");
        }}
        sx={{ cursor: "text" }}
      >
        <SvgIcon fontSize="inherit">
          <MagnifyingGlassIcon />
        </SvgIcon>
        <Typography fontSize=".875rem" lineHeight={1}>
          Search textbook...&nbsp;
        </Typography>
        <Box
          paddingX={0.5}
          fontSize=".7rem"
          sx={{
            bgcolor: "var(--palette-background-code)",
            borderRadius: "var(--shape-borderRadius)",
          }}
        >
          ⌘K
        </Box>
      </Stack>
      <SearchModal
        open={open}
        onClose={() => setOpen(false)}
        query={query}
        setQuery={setQuery}
        {...props}
      />
    </>
  );
}

export type SearchModalProps = SearchClientProps & {
  open: boolean;
  onClose: () => void;
  query: string;
  setQuery: (query: string) => void;
};

function SearchModal(props: SearchModalProps) {
  const { open, onClose, query, setQuery } = props;
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ overflow: "auto" }}
      closeAfterTransition
      disableAutoFocus
      disableEnforceFocus
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0,0,0,.8)",
          },
        },
      }}
    >
      <Grow in={open}>
        <Container
          maxWidth="md"
          sx={{
            borderRadius: "var(--shape-borderRadius)",
            border: "1px solid var(--palette-divider)",
            backgroundColor: "var(--palette-background-paper)",
            position: "relative",
            top: "30%",
          }}
          disableGutters
        >
          <Stack
            direction="row"
            spacing={1}
            paddingY={1}
            paddingLeft={3}
            paddingRight={2}
            alignItems="center"
          >
            <TextField
              fullWidth
              autoFocus
              placeholder="Search textbook..."
              variant="standard"
              slotProps={{
                input: { disableUnderline: true, autoComplete: "off" },
              }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputRef={inputRef}
            />
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              sx={{ px: "4px", height: "24px" }}
              onClick={onClose}
            >
              Esc
            </Button>
          </Stack>
          <Divider />
          <Box paddingY={1} paddingX={2}>
            <SearchResults focusRef={inputRef} {...props} />
          </Box>
        </Container>
      </Grow>
    </Modal>
  );
}

type ClusteredResults = {
  title: string;
  path: string;
  results: SearchResult[];
};

function clusterResults(
  results: SearchResult[],
  empty?: boolean
): ClusteredResults[] {
  const clusters = new Map<string, ClusteredResults>();
  for (const result of results) {
    const cluster = clusters.get(result.path);
    if (cluster && !empty) cluster.results.push(result);
    if (!cluster) {
      clusters.set(result.path, {
        title: result.title,
        path: result.path,
        results: empty ? [] : [result],
      });
    }
  }
  return [...clusters.values()];
}

type SearchResultsProps = SearchClientProps & {
  open: boolean;
  onClose: () => void;
  query: string;
  focusRef: React.RefObject<HTMLElement | null>;
};

function SearchResults({
  defaultSuggestions,
  open,
  onClose,
  query,
  focusRef,
}: SearchResultsProps) {
  const [doc, setDoc] = React.useState<SearchIndex | null>(null);
  const docLoading = React.useRef(false);

  const [results, setResults] =
    React.useState<SearchResult[]>(defaultSuggestions);
  const clusters = React.useMemo(
    () => clusterResults(results, query.length === 0),
    [results, query]
  );

  React.useEffect(() => {
    if (query && doc) {
      const results = doc
        .search(query, 10, { enrich: true })
        .flatMap((r) => r.result.map((item) => item.doc));
      setResults(results);
    } else setResults(defaultSuggestions);
  }, [doc, query, defaultSuggestions]);

  /** Download the search index when the UI is opened */
  React.useEffect(() => {
    if (doc || !open) return;
    if (docLoading.current) return;
    docLoading.current = true;
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/search.json`)
      .then((res) => res.json())
      .then(async (data: SerializedIndex) => {
        const doc = newDoc();
        for (const [id, item] of data) {
          await doc.import(id, item);
        }
        return doc;
      })
      .then((doc) => setDoc(doc));
  }, [doc, open]);

  /* On arrow down/up change focus from tree to input and vice-versa */
  const firstItemRef = React.useRef<HTMLLIElement | null>(null);
  const lastFocusChange = React.useRef<number>(0);
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!focusRef?.current || !firstItemRef.current) return;

      if (
        event.key === "ArrowDown" &&
        focusRef.current === document.activeElement
      ) {
        event.preventDefault();
        firstItemRef.current.focus();
      }

      // We need to build in a small delay before switching to the
      // focusRef when pressing up arrow on the first item.
      // This is to prevent us from pressing up on the second item
      // and then focus immediately switching to the focusRef.
      if (
        event.key === "ArrowUp" &&
        firstItemRef.current === document.activeElement &&
        Date.now() - lastFocusChange.current > 25
      ) {
        event.preventDefault();
        focusRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusRef]);

  return (
    <SimpleTreeView
      disabledItemsFocusable
      onItemFocus={() => (lastFocusChange.current = Date.now())}
      onItemSelectionToggle={onClose}
      expandedItems={clusters.map((cluster) => cluster.path)}
      onExpandedItemsChange={() => {}}
    >
      {clusters.map((cluster, index) => (
        <TreeItem
          key={cluster.path}
          itemId={cluster.path}
          label={
            <IconLabel icon={<DocumentTextIcon />} content={cluster.title} />
          }
          href={cluster.path}
          ref={index === 0 ? firstItemRef : undefined}
        >
          {cluster.results.map((result) => (
            <TreeItem
              key={result.id}
              itemId={`${result.heading ? "heading" : "content"}-${
                result.slug
              }-${result.id}`}
              label={
                <IconLabel
                  icon={
                    result.heading ? <HashtagIcon /> : <Bars3BottomLeftIcon />
                  }
                  content={result.content}
                  query={query}
                />
              }
              href={`${result.path}#${result.slug}`}
            />
          ))}
        </TreeItem>
      ))}
      {results.length === 0 && (
        <Stack height={100} justifyContent="center">
          <Typography
            textAlign="center"
            color="textSecondary"
            sx={{ overflowWrap: "break-word" }}
          >
            No results found for &ldquo;
            {
              <Typography component="span" color="var(--palette-primary-main)">
                {query}
              </Typography>
            }
            &rdquo;
          </Typography>
        </Stack>
      )}
    </SimpleTreeView>
  );
}

function IconLabel({
  icon,
  content,
}: {
  icon?: React.ReactNode;
  content: string;
  query?: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <SvgIcon sx={{ fontSize: "1.25em" }}>{icon}</SvgIcon>
      <Typography whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
        {content}
      </Typography>
    </Stack>
  );
}