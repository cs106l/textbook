import ModeSwitcher from "./ModeSwitcher";

export async function generateStaticParams() {
  return [{ params: { slug: undefined } }];
}

export default async function Page({}: {
  params: Promise<{ slug?: string[] }>;
}) {
  return (
    <h1>
      <ModeSwitcher />
    </h1>
  );
}
