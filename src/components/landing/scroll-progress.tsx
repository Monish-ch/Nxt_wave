"use client"

import { motion, useScroll, useSpring } from "framer-motion"

/** Thin neon scroll-progress bar pinned to the very top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 130, damping: 30, restDelta: 0.001 })

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400"
    />
  )
}
