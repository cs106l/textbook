import FlexSearch from "flexsearch";

export enum SearchResultType {
  Page,
  Heading,
  Body,
}

export type SearchResult = {
  id: number;
  content: string;
  type: SearchResultType;
  path: string; // The link to the page
  slug?: string; // The slug of the containing section
  title: string; // The title of the containing page
};

export type SearchIndex = FlexSearch.Document<SearchResult, true>;
export type SerializedIndex = [string | number, SearchResult][];

export function newDoc(): SearchIndex {
  return new FlexSearch.Document<SearchResult, true>({
    document: {
      id: "id",
      index: "content",
      store: true,
    },
    tokenize: "forward",
  });
}
