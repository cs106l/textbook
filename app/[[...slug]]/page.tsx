import { Book, BookNode, buildBook } from "../book";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  Box,
  Container,
  Divider,
  Grid2,
  Grid2Props,
  Link,
  SvgIcon,
  Typography,
} from "@mui/material";

import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import React from "react";
import { StickyBlock } from "../layout";
import TOCView from "@/components/toc";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

type Params = {
  slug?: string[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const page = await getPage(params);
  return {
    title: page.meta.nav_title,
    description: page.meta.description,
  };
}

export async function generateStaticParams(): Promise<Params[]> {
  const book = await buildBook();
  const params: Params[] = [];

  function traverse(node: BookNode, path?: string[]) {
    const currentPath = node.route ? [...(path ?? []), node.route] : path;
    params.push({ slug: currentPath });
    node.children.forEach((page) => traverse(page, currentPath));
  }

  book.forEach((node) => traverse(node));
  return params;
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const page = await getPage(params);
  return (
    <Box
      flexGrow={1}
      display={{ md: "unset", lg: "flex" }}
      flexDirection="row"
      minWidth={0}
    >
      <Container
        maxWidth="md"
        sx={{ padding: 0, marginBottom: 4, minWidth: 0 }}
      >
        {page.content}
        <ChildPages
          pages={page.children.filter((p) => !p.meta.hidden)}
          marginTop={2}
        />
        <PageNavigation page={page} marginTop={4} />
      </Container>
      <StickyBlock display={{ xs: "none", lg: "block" }}>
        {page.toc.children.length > 0 && (
          <Box>
            <TOCView node={page} />
            <Divider sx={{ my: 2 }} />
          </Box>
        )}
        <Box>
          <Link
            href={page.meta.github}
            color="textSecondary"
            display="flex"
            alignItems="center"
            target="_blank"
          >
            <Typography fontSize="0.875rem">Edit on GitHub</Typography>
            <FontAwesomeIcon
              icon={faGithub}
              style={{ height: "16px", marginLeft: "8px" }}
            />
          </Link>
        </Box>
      </StickyBlock>
    </Box>
  );
}

async function getPage(params: Promise<Params>): Promise<BookNode> {
  const { slug } = await params;
  const book = await buildBook();
  if (slug === undefined) return book[0];

  function traverse(book: Book, path: string[]): BookNode {
    if (path.length === 0) notFound();
    const [current, ...rest] = path;
    const node = book.find((node) => node.route === current);
    if (node === undefined) notFound();
    if (rest.length === 0) return node;
    return traverse(node.children, rest);
  }

  return traverse(book, slug);
}

function ChildPages({ pages, ...rest }: Grid2Props & { pages: BookNode[] }) {
  if (pages.length === 0) return null;
  return (
    <Grid2 container spacing={2} {...rest}>
      {pages.map((page) => (
        <CardLink
          key={page.route}
          href={page.meta.path}
          sx={{
            "&:hover h4": {
              color: "var(--palette-primary-main)",
            },
          }}
        >
          <Typography variant="h4">{page.meta.nav_title}</Typography>
          <Typography>{page.meta.description}</Typography>
        </CardLink>
      ))}
    </Grid2>
  );
}

function PageNavigation({ page, ...rest }: Grid2Props & { page: BookNode }) {
  if (page.links.prev === null && page.links.next === null) return null;
  return (
    <Grid2 container spacing={2} {...rest}>
      <PageNavigationItem
        page={page.links.prev}
        label="Previous"
        icon={
          <SvgIcon fontSize="small">
            <ChevronLeftIcon />
          </SvgIcon>
        }
        align="left"
      />
      <PageNavigationItem
        page={page.links.next}
        label="Next"
        icon={
          <SvgIcon fontSize="small">
            <ChevronRightIcon />
          </SvgIcon>
        }
        align="right"
      />
    </Grid2>
  );
}

function PageNavigationItem({
  page,
  label,
  icon,
  align,
  ...rest
}: Grid2Props & {
  page: BookNode | null;
  icon: React.ReactNode;
  label: React.ReactNode;
  align: "left" | "right";
}) {
  return (
    <CardLink
      visibility={page === null ? "hidden" : undefined}
      href={page?.meta.path ?? ""}
      textAlign={align}
      sx={{
        opacity: 0.75,
        "&:hover": { opacity: 1.0, transition: "opacity 0.2s ease" },
      }}
      {...rest}
    >
      <Typography
        variant="h5"
        color="var(--palette-text-secondary)"
        display="flex"
        flexDirection={align === "left" ? "row" : "row-reverse"}
        alignItems="center"
      >
        {icon}
        {label}
      </Typography>
      <Typography>{page?.meta.nav_title}</Typography>
    </CardLink>
  );
}

function CardLink({ children, href, ...rest }: Grid2Props & { href: string }) {
  return (
    <Grid2
      size={{ xs: 12, sm: 6 }}
      border="1px solid var(--palette-divider)"
      borderRadius="var(--shape-borderRadius)"
      {...rest}
    >
      <Link
        href={href}
        padding={2}
        display="block"
        sx={{ textDecoration: "none", color: "unset" }}
      >
        {children}
      </Link>
    </Grid2>
  );
}
