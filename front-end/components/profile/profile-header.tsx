"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import { Camera, Check } from "lucide-react"

export function ProfileHeader() {
  const user = useStore((state) => state.user)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(user?.username || "")
  const [bio, setBio] = useState("")

  return (
    <div className="rounded-2xl bg-card border border-border p-8">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="w-24 h-24">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">{user?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <Button size="icon" className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary hover:bg-primary/90">
            <Camera className="w-4 h-4" />
          </Button>
        </div>

        {/* Info */}
        <div className="flex-1">
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setEditing(false)}>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{user?.username || "User"}</h1>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                {bio || "Web3 builder passionate about creating innovative decentralized applications."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
