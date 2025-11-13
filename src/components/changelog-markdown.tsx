import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  LiHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export const markdownComponents = {
  h1: (props: HTMLAttributes<HTMLHeadingElement>) => {
    const { className, ...rest } = props;
    return (
      <h1
        {...rest}
        className={cn(
          "mb-6 mt-10 text-3xl font-semibold tracking-tight text-neutral-900 first:mt-0",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => {
    const { className, ...rest } = props;
    return (
      <h2
        {...rest}
        className={cn(
          "mb-4 mt-8 scroll-m-24 text-2xl font-semibold tracking-tight text-neutral-900 first:mt-0",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => {
    const { className, ...rest } = props;
    return (
      <h3
        {...rest}
        className={cn(
          "mb-3 mt-6 scroll-m-24 text-xl font-semibold text-neutral-900",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
  p: (props: HTMLAttributes<HTMLParagraphElement>) => {
    const { className, ...rest } = props;
    return (
      <p
        {...rest}
        className={cn(
          "mb-5 leading-7 text-neutral-600 last:mb-0",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
  a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const { className, ...rest } = props;
    return (
      <a
        {...rest}
        className={cn(
          "font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-4 transition-colors hover:text-neutral-700 hover:decoration-neutral-600",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
  ul: (props: HTMLAttributes<HTMLUListElement>) => {
    const { className, ...rest } = props;
    return (
      <ul
        {...rest}
        className={cn(
          "mb-5 space-y-2 pl-5 text-neutral-600 marker:text-neutral-400",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
  ol: (props: HTMLAttributes<HTMLOListElement>) => {
    const { className, ...rest } = props;
    return (
      <ol
        {...rest}
        className={cn(
          "mb-5 space-y-2 pl-5 text-neutral-600 marker:text-neutral-400",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
  li: (props: LiHTMLAttributes<HTMLLIElement>) => {
    const { className, ...rest } = props;
    return (
      <li
        {...rest}
        className={cn(
          "pl-1 leading-7 text-neutral-600 [&>ul]:mt-2 [&>ol]:mt-2",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
  blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => {
    const { className, ...rest } = props;
    return (
      <blockquote
        {...rest}
        className={cn(
          "relative mb-6 rounded-2xl border-l-4 border-neutral-200 bg-neutral-100/70 px-6 py-4 text-neutral-700",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
  code: (props: HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
    const { className, inline, ...rest } = props;
    if (inline) {
      return (
        <code
          {...rest}
          className={cn(
            "rounded-md bg-neutral-900/90 px-1.5 py-1 text-sm font-medium text-neutral-100",
            className && typeof className === "string" ? className : undefined,
          )}
        />
      );
    }

    return (
      <code
        {...rest}
        className={cn(
          "block w-full overflow-x-auto rounded-2xl bg-neutral-900/95 p-4 text-sm text-neutral-100 shadow-inner",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
  hr: (props: HTMLAttributes<HTMLHRElement>) => {
    const { className, ...rest } = props;
    return (
      <hr
        {...rest}
        className={cn(
          "my-10 border-neutral-200/70",
          className && typeof className === "string" ? className : undefined,
        )}
      />
    );
  },
};

