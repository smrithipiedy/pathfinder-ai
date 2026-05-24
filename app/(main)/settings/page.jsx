import { getUserSettings, updateUserSettings } from "@/actions/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const settings = await getUserSettings();

  async function handleToggle(key, value) {
    "use server";
    await updateUserSettings({ [key]: value });
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Enable Notifications</Label>
            <Switch
              id="notifications"
              checked={settings?.notifications}
              onCheckedChange={(checked) => handleToggle("notifications", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="emailAlerts">Email Alerts</Label>
            <Switch
              id="emailAlerts"
              checked={settings?.emailAlerts}
              onCheckedChange={(checked) => handleToggle("emailAlerts", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
