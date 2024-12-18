import { Button, Container } from "@mui/material";
import ModeSwitcher from "./ModeSwitcher";

export async function generateStaticParams() {
  return [{ slug: undefined }];
}

export default async function Page({}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { default: Page } = await import("@/src/index.md");
  return (
    <div>
      <ModeSwitcher />
      <Container maxWidth="md">
        <Page />
      </Container>
    </div>
  );
}
