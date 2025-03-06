import React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Become a Real Estate Coach | Dibs",
  description: "Join our elite network of real estate coaches. Share your expertise, build your brand, and create an additional income stream while helping others succeed.",
}

const BecomeCoachLayout: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return children
}

export default BecomeCoachLayout 