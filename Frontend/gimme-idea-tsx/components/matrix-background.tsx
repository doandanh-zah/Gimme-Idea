"use client"

import { useEffect, useState } from "react"

export default function MatrixBackground() {
  const [spanCount, setSpanCount] = useState(560)

  useEffect(() => {
    const updateSpanCount = () => {
      const screenWidth = window.innerWidth

      if (screenWidth > 1024) {
        setSpanCount(280) // Desktop: 16x16 grid
      } else if (screenWidth > 768) {
        setSpanCount(160) // Tablet: 10x10 grid
      } else {
        setSpanCount(80) // Mobile: 5x5 grid
      }

      console.log("[v0] ✅ Matrix background updated with", spanCount, "spans")
    }

    updateSpanCount()

    let resizeTimer: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(updateSpanCount, 500)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [spanCount])

  return (
    <section className="absolute w-screen h-screen flex justify-center items-center gap-[2px] flex-wrap overflow-hidden before:content-[''] before:absolute before:w-full before:h-full before:bg-gradient-to-b before:from-black before:via-[#ff00ff] before:to-black before:animate-[matrixAnimate_5s_linear_infinite]">
      {Array.from({ length: spanCount }).map((_, i) => (
        <span
          key={i}
          className="relative block w-[calc(6.25vw-2px)] h-[calc(6.25vw-2px)] bg-[lab(4.84%_3.48_-8.21)] z-[2] transition-all duration-[1.5s] hover:bg-primary hover:transition-none md:w-[calc(10vw-2px)] md:h-[calc(10vw-2px)] max-md:w-[calc(20vw-2px)] max-md:h-[calc(20vw-2px)]"
        />
      ))}
    </section>
  )
}
