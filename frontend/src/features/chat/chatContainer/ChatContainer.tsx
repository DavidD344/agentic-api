"use client";
import { VariantProps } from "class-variance-authority";
import React, { type HTMLAttributes, useEffect, useRef, useState } from "react";
import { chatContainerCVA } from "./chatContainerCVA";
import { cn } from "@/ds/utils/cnMerge";

interface ChatContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatContainerCVA> {
  /** margem para considerar que estamos no fundo (px) */
  autoscrollThreshold?: number;
  /** usar scroll suave ao acompanhar novos itens */
  smoothAutoscroll?: boolean;
  children?: React.ReactNode;
}

const ChatContainer = ({
  children,
  typeContainer,
  className,
  autoscrollThreshold = 32,
  smoothAutoscroll = true,
  ...restProps
}: ChatContainerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    setIsAtBottom(distanceToBottom <= autoscrollThreshold);
  };

  useEffect(() => {
    const container = scrollRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const scrollToBottom = () => {
      if (!isAtBottom) return;
      const behavior = smoothAutoscroll ? "smooth" : "auto";
      container.scrollTo({ top: container.scrollHeight, behavior });
    };

    scrollToBottom();

    const ro = new ResizeObserver(() => {
      scrollToBottom();
    });
    ro.observe(content);

    return () => ro.disconnect();
  }, [isAtBottom, smoothAutoscroll]);

  return (
    <div
      {...restProps}
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn(
        chatContainerCVA({
          className,
          typeContainer,
        }),
        // pequenas melhorias de UX no scroll
        "overscroll-behavior:contain scroll-smooth"
      )}
    >
      <div
        ref={contentRef}
        className="w-full h-auto flex flex-col flex-1 max-w-[100rem] gap-6"
      >
        {children}
        <div aria-hidden className="h-px w-full" />
      </div>
    </div>
  );
};

export { ChatContainer };
