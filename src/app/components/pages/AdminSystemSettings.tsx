import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Settings, Save } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function AdminSystemSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await api.getSystemSettingsComplete();
      if (result.success) setSettings(result.data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    try {
      const result = await api.updateSettingAdmin(key, value);
      if (result.success) {
        toast.success('Setting updated');
        loadSettings();
      }
    } catch (error) {
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const settingGroups = {
    'Platform': settings.filter(s => s.setting_key.startsWith('platform_')),
    'Commission': settings.filter(s => s.setting_key.startsWith('commission_')),
    'Security': settings.filter(s => s.setting_key.startsWith('security_')),
    'Payment': settings.filter(s => s.setting_key.startsWith('payment_')),
    'Other': settings.filter(s => !['platform_', 'commission_', 'security_', 'payment_'].some(p => s.setting_key.startsWith(p)))
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8" />
        <h1 className="text-3xl font-bold">System Settings</h1>
      </div>

      <div className="grid gap-6">
        {Object.entries(settingGroups).map(([group, groupSettings]) => (
          groupSettings.length > 0 && (
            <Card key={group}>
              <CardHeader>
                <CardTitle>{group} Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupSettings.map((setting) => (
                    <div key={setting.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor={`setting-${setting.id}`} className="text-sm font-medium">
                          {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Label>
                        <Input
                          id={`setting-${setting.id}`}
                          defaultValue={setting.setting_value}
                          className="mt-1"
                          onBlur={(e) => {
                            if (e.target.value !== setting.setting_value) {
                              handleSave(setting.setting_key, e.target.value);
                            }
                          }}
                        />
                        {setting.description && (
                          <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`setting-${setting.id}`) as HTMLInputElement;
                          handleSave(setting.setting_key, input.value);
                        }}
                        disabled={saving}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>

      {settings.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No settings found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
