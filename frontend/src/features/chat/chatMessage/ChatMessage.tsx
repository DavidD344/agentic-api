"use client";

import { VariantProps } from "class-variance-authority";
import React from "react";
import { chatMessageCVA } from "./chatMessageCVA";
import { cn } from "@/ds/utils/cnMerge";
import { Footnote } from "@/ds/typography/Footnote/Footnote";
import { Body } from "@/ds/typography/Body/Body";
import { getInitials } from "@/helpers/getInitials/getInitials";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

interface ChatMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatMessageCVA> {
  children?: React.ReactNode; // deve ser string no uso real
  date: string;
  ownerSendBy: string;
  userName?: string;
  sendBy: string;
}

export const allowed: readonly string[] = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "strong",
  "em",
  "del",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "hr",
  "a",
  "img",
  "br",
];

const ChatMessage = ({
  children,
  className,
  date,
  sendBy,
  ownerSendBy,
  userName,
  ...restProps
}: ChatMessageProps) => {
  const text = (typeof children === "string" ? children : "") as string;
  const isAssistantMessage = ownerSendBy === sendBy;
  const isWaitingAssistantResponse = isAssistantMessage && text.trim().length === 0;

  return (
    <div
      className={`w-full h-fit flex flex-row ${
        ownerSendBy === sendBy ? "" : "justify-end"
      }`}
    >
      <div
        className={cn(
          "",
          ownerSendBy !== sendBy && "flex flex-row gap-3 justify-end"
        )}
      >
        <div
          {...restProps}
          className={cn(
            chatMessageCVA({
              className,
              typeMessage:
                ownerSendBy === sendBy ? "meMessage" : "otherMessage",
            })
          )}
        >
          {isWaitingAssistantResponse ? (
            <div
              className="flex h-[1.6rem] min-w-[3.2rem] items-center gap-1"
              aria-label="Aguardando resposta"
              role="status"
            >
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white opacity-50 [animation-delay:-0.24s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white opacity-70 [animation-delay:-0.12s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white opacity-90" />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                allowedElements={allowed as any}
                remarkPlugins={[remarkGfm, remarkBreaks]}
                unwrapDisallowed
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer">
                      {props.children}
                    </a>
                  ),
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0 whitespace-pre-wrap font-sans md:text-[1.4rem] text-[1.6rem] leading-relaxed">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="font-sans md:text-[1.4rem] text-[1.6rem] leading-relaxed">
                      {children}
                    </li>
                  ),
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          )}
          <Footnote
            className={`hidden w-full text-GrayScale-TextIcon-Caption pt-1 ${
              ownerSendBy === sendBy ? "text-end" : ""
            }`}
            weight={"Bold"}
          >
            {date}
          </Footnote>
        </div>
        {ownerSendBy !== sendBy && (
          <div className="w-[4rem] h-[4rem] rounded-full bg-[#F8F9FA] flex justify-center items-center border-[1px] border-[#A1A1A1]">
            <Body
              weight={"Medium"}
              className={`text-center text-[#1D1D1D] text-[1.6rem] `}
            >
              {getInitials({ stringNames: userName || "" })}
            </Body>
          </div>
        )}
      </div>
    </div>
  );
};

export { ChatMessage };
