import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileStats } from "@/components/profile/profile-stats"
import { WalletSection } from "@/components/profile/wallet-section"
import { SettingsTabs } from "@/components/profile/settings-tabs"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <ProfileHeader />
          <ProfileStats />
          <WalletSection />
          <SettingsTabs />
        </div>
      </main>
    </div>
  )
}
