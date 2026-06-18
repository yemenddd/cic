"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CtaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageSrc: string;
  titleA: string;
  titleB: string;
  description: string;
  buttonText: string;
  href: string;
}

const CtaCard = React.forwardRef<HTMLDivElement, CtaCardProps>(
  (
    {
      className,
      imageSrc,
      titleA,
      titleB,
      description,
      buttonText,
      href,
      ...props
    },
    ref
  ) => {

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2, delayChildren: 0.1 },
      },
    };

    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 12 },
      },
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl",
          className
        )}
        {...props}
      >
        {/* Background Image */}
        <img
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />

        {/* Content */}
        <motion.div
          className="relative z-10 grid h-full grid-cols-1 items-center gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="flex flex-col items-start text-left text-white">
            <motion.h2
              className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl"
              variants={itemVariants}
            >
              <span className="block">{titleA}</span>
              <span className="block">{titleB}</span>
            </motion.h2>
            <motion.p
              className="mt-4 max-w-xl text-lg text-neutral-200"
              variants={itemVariants}
            >
              {description}
            </motion.p>
          </div>

          <motion.div
            className="flex w-full items-center justify-center md:justify-end"
            variants={itemVariants}
          >
            <Link
              href={href}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-black transition-colors hover:bg-neutral-200"
            >
              <ArrowLeft className="h-4 w-4" />
              {buttonText}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }
);

CtaCard.displayName = "CtaCard";

export { CtaCard };
