"use client"

import { useState } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Bell, Lock, User, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("account")
  const [isSaving, setIsSaving] = useState(false)

  const [accountData, setAccountData] = useState({
    email: user?.email || "",
    username: user?.username || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    feedbackNotifications: true,
    projectUpdates: true,
    weeklyDigest: false,
  })

  const handleSaveAccount = async () => {
    setIsSaving(true)
    // TODO: Implement API call
    setTimeout(() => {
      setIsSaving(false)
      alert("Account settings saved!")
    }, 1000)
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords don't match!")
      return
    }
    setIsSaving(true)
    // TODO: Implement API call
    setTimeout(() => {
      setIsSaving(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      alert("Password changed successfully!")
    }, 1000)
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    // TODO: Implement API call
    setTimeout(() => {
      setIsSaving(false)
      alert("Notification settings saved!")
    }, 1000)
  }

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ]

  return (
    <LayoutWrapper>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64 shrink-0">
            <div className="glass rounded-lg border p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="glass rounded-lg border p-6 space-y-6">
              {/* Account Tab */}
              {activeTab === "account" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Account Settings</h2>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <Input
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                      className="bg-muted/50 border-muted"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed at this time
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                    <Input
                      type="text"
                      value={accountData.username}
                      onChange={(e) => setAccountData({ ...accountData, username: e.target.value })}
                      className="bg-muted/50 border-muted"
                    />
                  </div>

                  <Button
                    onClick={handleSaveAccount}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Change Password</h2>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                    <PasswordInput
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      className="bg-muted/50 border-muted"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                    <PasswordInput
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="bg-muted/50 border-muted"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                    <PasswordInput
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      className="bg-muted/50 border-muted"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSaving ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>

                  <div className="space-y-4">
                    {Object.entries(notificationSettings).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30">
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {key === "emailNotifications" && "Receive email notifications for important updates"}
                            {key === "feedbackNotifications" && "Get notified when someone leaves feedback"}
                            {key === "projectUpdates" && "Updates about your projects and contributions"}
                            {key === "weeklyDigest" && "Weekly summary of your activity"}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setNotificationSettings({ ...notificationSettings, [key]: !value })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              value ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </label>
                    ))}
                  </div>

                  <Button
                    onClick={handleSaveNotifications}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSaving ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === "danger" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-destructive">Danger Zone</h2>

                  <div className="border border-destructive/50 rounded-lg p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground">Delete Account</h3>
                      <p className="text-sm text-muted-foreground">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Are you absolutely sure you want to delete your account?")) {
                          alert("Account deletion is not implemented yet. Contact support for assistance.")
                        }
                      }}
                    >
                      Delete My Account
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}
