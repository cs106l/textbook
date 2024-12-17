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
      <Page />
    </div>
  );
}
