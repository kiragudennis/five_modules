"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openItems: string[];
  setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
  type: "single" | "multiple";
  collapsible?: boolean;
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(
  undefined,
);

const useAccordion = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("useAccordion must be used within an Accordion");
  }
  return context;
};

interface AccordionProps {
  type?: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
}

export const Accordion = ({
  type = "single",
  collapsible = true,
  defaultValue,
  children,
  className,
}: AccordionProps) => {
  const [openItems, setOpenItems] = React.useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  return (
    <AccordionContext.Provider
      value={{ openItems, setOpenItems, type, collapsible }}
    >
      <div className={cn("divide-y divide-border", className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const AccordionItem = ({
  value,
  children,
  className,
}: AccordionItemProps) => {
  return (
    <div className={cn("border-b border-border", className)} data-state={value}>
      {children}
    </div>
  );
};

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const AccordionTrigger = ({
  children,
  className,
  disabled = false,
}: AccordionTriggerProps) => {
  const { openItems, setOpenItems, type, collapsible } = useAccordion();
  const contextValue = React.useContext(AccordionContext);
  const itemValue = React.useContext(AccordionItemContext);

  const isOpen = openItems.includes(itemValue);

  const handleClick = () => {
    if (disabled) return;

    setOpenItems((prev) => {
      if (isOpen) {
        if (type === "single" && !collapsible) return prev;
        return prev.filter((item) => item !== itemValue);
      } else {
        if (type === "single") {
          return [itemValue];
        }
        return [...prev, itemValue];
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
      />
    </button>
  );
};

const AccordionItemContext = React.createContext<string>("");

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export const AccordionContent = ({
  children,
  className,
}: AccordionContentProps) => {
  const itemValue = React.useContext(AccordionItemContext);
  const { openItems } = useAccordion();
  const isOpen = openItems.includes(itemValue);

  return (
    <div
      className={cn(
        "overflow-hidden text-sm transition-all",
        isOpen ? "animate-accordion-down" : "animate-accordion-up",
      )}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  );
};

// Wrapper component to provide item context
interface AccordionItemWrapperProps extends AccordionItemProps {
  value: string;
}

export const AccordionItemWrapper = ({
  value,
  children,
  className,
}: AccordionItemWrapperProps) => {
  return (
    <AccordionItemContext.Provider value={value}>
      <AccordionItem value={value} className={className}>
        {children}
      </AccordionItem>
    </AccordionItemContext.Provider>
  );
};

// Re-export with better names
export const AccordionRoot = Accordion;
export const AccordionHeader = AccordionTrigger;
export const AccordionBody = AccordionContent;
