"use client"

import { useState } from "react"
import { ProjectCard } from "./project-card"
import { Button } from "@/components/ui/button"
import { PROJECT_CATEGORIES, SORT_OPTIONS } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data
const mockProjects = [
  {
    id: "1",
    title: "DeFi Lending Protocol",
    description: "A decentralized lending platform with innovative collateral mechanisms",
    coverImage: "/defi-protocol.png",
    category: "DeFi",
    tags: ["Solana", "Smart Contracts", "DeFi"],
    aiScore: 87,
    views: 1234,
    feedbackCount: 23,
    creator: {
      username: "alice_dev",
      avatar: "/diverse-avatars.png",
    },
  },
  {
    id: "2",
    title: "NFT Marketplace",
    description: "Next-gen NFT marketplace with AI-powered recommendations",
    coverImage: "/nft-marketplace-concept.png",
    category: "NFT",
    tags: ["NFT", "Marketplace", "Web3"],
    aiScore: 92,
    views: 2341,
    feedbackCount: 45,
    creator: {
      username: "bob_creator",
      avatar: "/pandora-ocean-scene.png",
    },
  },
  {
    id: "3",
    title: "GameFi Platform",
    description: "Play-to-earn gaming platform with unique tokenomics",
    coverImage: "/gaming-platform.jpg",
    category: "Gaming",
    tags: ["Gaming", "P2E", "Tokens"],
    aiScore: 78,
    views: 987,
    feedbackCount: 12,
    creator: {
      username: "charlie_games",
      avatar: "/diverse-group-futuristic-setting.png",
    },
  },
  {
    id: "4",
    title: "Social DAO",
    description: "Community-driven social platform with governance tokens",
    coverImage: "/social-dao.jpg",
    category: "DAO",
    tags: ["DAO", "Social", "Governance"],
    aiScore: 85,
    views: 1567,
    feedbackCount: 34,
    creator: {
      username: "dana_social",
      avatar: "/diverse-group-futuristic-avatars.png",
    },
  },
]

export function ProjectsGrid() {
  const [category, setCategory] = useState<string>("all")
  const [sort, setSort] = useState<string>("recent")

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={category === "all" ? "default" : "outline"} size="sm" onClick={() => setCategory("all")}>
            All
          </Button>
          {PROJECT_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-40 ml-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {mockProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-4">
        <Button variant="outline" size="lg">
          Load More Projects
        </Button>
      </div>
    </div>
  )
}
