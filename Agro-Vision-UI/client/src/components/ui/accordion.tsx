import * as React from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Accordion({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("flex flex-col gap-3", className)}>{children}</div>;
}

export function AccordionItem({ 
  title, 
  children, 
  icon,
  defaultOpen = false 
}: { 
  title: string, 
  children: React.ReactNode, 
  icon?: React.ReactNode,
  defaultOpen?: boolean 
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-transparent text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-primary">{icon}</span>}
          <span className="font-semibold text-foreground text-lg">{title}</span>
        </div>
        <ChevronDown 
          className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} 
        />
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-4 pt-0 text-muted-foreground leading-relaxed border-t border-border/20 mt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
