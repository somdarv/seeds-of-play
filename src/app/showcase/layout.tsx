import type { ReactNode } from "react";

export const metadata = {
  title: "Kalaanba — UI Foundation",
  description: "Isolated component showcase for Kalaanba.",
};

export default function ShowcaseLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
