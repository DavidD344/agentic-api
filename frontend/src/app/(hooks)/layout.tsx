"use client";

import { queryClient } from "@/api-queries/queryClient";
import { ConfirmationMessageContainer } from "@/features/confirmationMessage/components/ConfirmationMessageContainer";
import { NotificationContainer } from "@/features/notification/components/NotificationContainer";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import AOS from "aos";
import "aos/dist/aos.css";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
export default function ProcessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    AOS.init({
      delay: 200,
      duration: 1400,
      offset: -20,
      once: true,
    });
  }, []);
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationContainer />
      <ConfirmationMessageContainer />

      {children}
      <div
        style={{
          fontSize: "1.6rem",
        }}
      >
        <ReactQueryDevtools initialIsOpen={false} />
      </div>
    </QueryClientProvider>
  );
}
