import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  LiHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export const markdownComponents = {
  h1: (props: HTMLAttributes<HTMLHeadingElement>) => {
    const { className, children, ...rest } = props;
    return (
      <h1
        {...rest}
        className={cn(
          "mb-4 mt-0 text-2xl font-semibold text-neutral-900 border-b border-neutral-300 pb-2 break-words",
          className && typeof className === "string" ? className : undefined,
        )}
      >
        {children}
      </h1>
    );
  },
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => {
    const { className, children, ...rest } = props;
    return (
      <h2
        {...rest}
        className={cn(
          "mb-3 mt-6 text-xl font-semibold text-neutral-900 break-words",
          className && typeof className === "string" ? className : undefined,
        )}
      >
        {children}
      </h2>
    );
  },
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => {
    const { className, children, ...rest } = props;
    return (
      <h3
        {...rest}
        className={cn(
          "mb-2 mt-4 text-lg font-semibold text-neutral-900 break-words",
          className && typeof className === "string" ? className : undefined,
        )}
      >
        {children}
      </h3>
    );
  },
  p: (props: HTMLAttributes<HTMLParagraphElement>) => {
    const { className, children, ...rest } = props;
    return (
      <p
        {...rest}
        className={cn(
          "mb-4 leading-7 text-neutral-900 last:mb-0 break-words",
          className && typeof className === "string" ? className : undefined,
        )}
      >
        {children}
      </p>
    );
  },
  a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const { className, children, ...rest } = props;
    return (
      <a
        {...rest}
        className={cn(
          "font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-4 transition-colors hover:text-neutral-700 hover:decoration-neutral-600 break-words",
          className && typeof className === "string" ? className : undefined,
        )}
      >
        {children}
      </a>
    );
  },
  ul: (props: HTMLAttributes<HTMLUListElement>) => {
    const { className, children, ...rest } = props;
    return (
      <ul
        {...rest}
        className={cn(
          "mb-4 space-y-0.5 pl-6 list-disc text-neutral-900 break-words",
          className && typeof className === "string" ? className : undefined,
        )}
      >
        {children}
      </ul>
    );
  },
  ol: (props: HTMLAttributes<HTMLOListElement>) => {
    const { className, children, ...rest } = props;
    return (
      <ol
        {...rest}
        className={cn(
          "mb-4 space-y-1 pl-6 list-decimal text-neutral-900 break-words",
          className && typeof className === "string" ? className : undefined,
        )}
      >
        {children}
      </ol>
    );
  },
  li: (props: LiHTMLAttributes<HTMLLIElement>) => {
    const { className, children, ...rest } = props;
    return (
      <li
        {...rest}
        className={cn(
          "leading-7 text-neutral-900 break-words [&>ul]:mt-2 [&>ol]:mt-2",
          className && typeof className === "string" ? className : undefined,
        )}
      >
        {children}
      </li>
    );
  },
  blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => {
    const { className, children, ...rest } = props;
    return (
      <blockquote
        {...rest}
        className={cn(
          "relative mb-6 rounded-2xl border-l-4 border-neutral-200 bg-neutral-100/70 px-6 py-4 text-neutral-700 break-words",
          className && typeof className === "string" ? className : undefined,
        )}
      >
        {children}
      </blockquote>
    );
  },
  code: (props: HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
    const { className, inline, children, ...rest } = props;
    if (inline) {
      return (
        <code
          {...rest}
          className={cn(
            "px-1.5 py-0.5 text-sm font-mono bg-neutral-100 text-neutral-800 rounded break-words whitespace-normal",
            className && typeof className === "string" ? className : undefined,
          )}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        {...rest}
        className={cn(
          "block w-full p-4 text-sm font-mono bg-neutral-50 text-neutral-900 rounded border border-neutral-200 break-words whitespace-pre-wrap overflow-wrap-anywhere",
          className && typeof className === "string" ? className : undefined,
        )}
      >
        {children}
      </code>
    );
  },
  hr: (props: HTMLAttributes<HTMLHRElement>) => {
    const { className, ...rest } = props;
    return (
      <hr
        {...rest}
        className={cn(
          "my-6 border-neutral-200",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
};

