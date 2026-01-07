"use client"
import { motion, Transition } from "framer-motion"
import { Twitter, Github, Linkedin } from "lucide-react"

// Animation variants for reusability
const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: "easeOut" as const,
            staggerChildren: 0.1,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, ease: "easeOut" as const },
    },
}

const linkVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" as const },
    },
}

const socialVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 200,
            damping: 10,
        },
    },
}

const backgroundVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 2,
            ease: "easeOut" as const,
        },
    },
}

// Footer data for better maintainability
const footerData = {
    sections: [
        { title: "Product", links: ["Features", "Pricing", "Templates", "AI Models"] },
        { title: "Company", links: ["About", "Careers", "Contact", "Blog"] },
        { title: "Resources", links: ["Documentation", "Support", "API", "Community"] },
        { title: "Legal", links: ["Privacy", "Terms", "Cookies", "Licenses"] },
    ],
    social: [
        { href: "#", label: "Twitter", icon: <Twitter className="w-5 h-5" /> },
        { href: "#", label: "GitHub", icon: <Github className="w-5 h-5" /> },
        { href: "#", label: "LinkedIn", icon: <Linkedin className="w-5 h-5" /> },
    ],
    title: "MugShot Studio",
    subtitle: "AI-powered thumbnail generation",
    copyright: "©2025 MugShot Studio. All rights reserved.",
}

// Reusable components
const NavSection = ({ title, links, index }: { title: string; links: string[]; index: number }) => (
    <motion.div variants={itemVariants} custom={index} className="flex flex-col gap-2">
        <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            className="mb-2 uppercase text-[#9b896c]/60 text-xs font-semibold tracking-wider border-b border-[#9b896c]/20 pb-1"
        >
            {title}
        </motion.h3>
        {links.map((link, linkIndex) => (
            <motion.a
                key={linkIndex}
                variants={linkVariants}
                custom={linkIndex}
                href="#"
                whileHover={{
                    x: 8,
                    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
                }}
                className="text-[#9b896c]/80 hover:text-[#9b896c] transition-colors duration-300 font-sans text-xs md:text-sm group relative"
            >
                <span className="relative">
                    {link}
                    <motion.span
                        className="absolute bottom-0 left-0 h-0.5 bg-[#9b896c]"
                        initial={{ width: 0 }}
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                    />
                </span>
            </motion.a>
        ))}
    </motion.div>
)

const SocialLink = ({ href, label, icon, index }: { href: string; label: string; icon: React.ReactNode; index: number }) => (
    <motion.a
        variants={socialVariants}
        custom={index}
        href={href}
        whileHover={{
            scale: 1.2,
            rotate: 12,
            transition: { type: "spring" as const, stiffness: 300, damping: 15 },
        }}
        whileTap={{ scale: 0.9 }}
        className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#9b896c]/20 hover:bg-[#9b896c] flex items-center justify-center transition-colors duration-300 group"
        aria-label={label}
    >
        <motion.span
            className="text-xs md:text-sm font-bold text-[#9b896c] group-hover:text-[#0a3d40]"
            whileHover={{ scale: 1.1 }}
        >
            {icon}
        </motion.span>
    </motion.a>
)

export default function StickyFooter() {
    return (
        <footer className="relative w-full">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="bg-gradient-to-br from-[#0a3d40] via-[#0a3d40] to-[#0a3d40] py-6 md:py-12 px-4 md:px-12 min-h-[70vh] w-full flex flex-col justify-between relative overflow-hidden"
            >
                {/* Navigation Section */}
                <motion.div variants={containerVariants} className="relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 lg:gap-20">
                        {footerData.sections.map((section, index) => (
                            <NavSection key={section.title} title={section.title} links={section.links} index={index} />
                        ))}
                    </div>
                </motion.div>

                {/* Footer Bottom Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" as const }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end relative z-10 gap-4 md:gap-6 mt-6"
                >
                    <div className="flex-1">
                        <motion.h1
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1, duration: 0.8, ease: "easeOut" as const }}
                            whileHover={{
                                scale: 1.02,
                                transition: { type: "spring" as const, stiffness: 300, damping: 20 },
                            }}
                            className="text-[12vw] md:text-[10vw] lg:text-[8vw] xl:text-[6vw] leading-[0.8] font-serif text-[#9b896c] cursor-default"
                        >
                            {footerData.title}
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            whileInView={{ opacity: 1, width: "auto" }}
                            viewport={{ once: true }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="flex items-center gap-3 md:gap-4 mt-3 md:mt-4"
                        >
                            <motion.div
                                className="w-8 md:w-12 h-0.5 bg-[#9b896c]"
                                animate={{
                                    scaleX: [1, 1.2, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut" as const,
                                }}
                            />
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 1.4, duration: 0.5 }}
                                className="text-[#9b896c]/80 text-xs md:text-sm font-sans"
                            >
                                {footerData.subtitle}
                            </motion.p>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.6, duration: 0.6 }}
                        className="text-left md:text-right"
                    >
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1.8, duration: 0.5 }}
                            className="text-[#9b896c]/80 text-xs md:text-sm mb-2 md:mb-3"
                        >
                            {footerData.copyright}
                        </motion.p>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            transition={{ delay: 2, staggerChildren: 0.1 }}
                            className="flex gap-2 md:gap-3"
                        >
                            {footerData.social.map((social, index) => (
                                <SocialLink
                                    key={social.label}
                                    href={social.href}
                                    label={social.label}
                                    icon={social.icon}
                                    index={index}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </footer>
    )
}
