import { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 pb-16">{children}</div>;
}
