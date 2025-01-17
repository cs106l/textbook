import FlexSearch from "flexsearch";

export type SearchResult = {
  id: number;
  content: string;
  heading: boolean; // Is this search result a heading?
  path: string; // The link to the page
  slug: string; // The slug of the containing section
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
