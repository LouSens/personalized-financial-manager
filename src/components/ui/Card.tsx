import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    glow?: boolean;
}

const Card: React.FC<CardProps> = ({
    children,
    className,
    noPadding = false,
    glow = true,
    ...props
}) => {
    return (
        <div className={cn("relative group rounded-2xl", className)}>
            {/* Prismatic Glow Border - Visible on Hover/Active in Dark Mode */}
            {glow && (
                <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl opacity-0 dark:opacity-0 dark:group-hover:opacity-100 blur-sm transition duration-500 group-hover:duration-200" />
            )}

            {/* Main Card Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                    "relative h-full w-full rounded-2xl overflow-hidden transition-all duration-300",
                    // Light Mode
                    "bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
                    // Dark Mode
                    "dark:bg-black dark:border-zinc-800 dark:shadow-none",
                    !noPadding && "p-6"
                )}
                {...props}
            >
                {children}
            </motion.div>
        </div>
    );
};

export default Card;
