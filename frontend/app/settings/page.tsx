"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { 
  Settings, 
  Database, 
  Globe, 
  Shield, 
  Bell, 
  Mic, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Upload
} from "lucide-react"

interface SettingsData {
  // General Settings
  language: string
  theme: string
  timezone: string
  autoSave: boolean
  
  // Processing Settings  
  defaultModel: string
  confidenceThreshold: number
  autoProcess: boolean
  batchSize: number
  
  // Notification Settings
  emailNotifications: boolean
  systemNotifications: boolean
  completionNotifications: boolean
  errorNotifications: boolean
  
  // Security Settings
  sessionTimeout: number
  requireReauth: boolean
  auditLogging: boolean
  
  // API Settings
  apiTimeout: number
  retryAttempts: number
  cacheEnabled: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    language: "ru",
    theme: "light",
    timezone: "UTC+3",
    autoSave: true,
    defaultModel: "whisper-large-v3",
    confidenceThreshold: 0.8,
    autoProcess: true,
    batchSize: 5,
    emailNotifications: true,
    systemNotifications: true,
    completionNotifications: true,
    errorNotifications: true,
    sessionTimeout: 60,
    requireReauth: false,
    auditLogging: true,
    apiTimeout: 30,
    retryAttempts: 3,
    cacheEnabled: true
  })

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // In a real app, this would fetch from your API
      const savedSettings = localStorage.getItem('speechAnalyticsSettings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError('Failed to load settings')
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // In a real app, this would save to your API
      localStorage.setItem('speechAnalyticsSettings', JSON.stringify(settings))
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const resetSettings = () => {
    setSettings({
      language: "ru",
      theme: "light", 
      timezone: "UTC+3",
      autoSave: true,
      defaultModel: "whisper-large-v3",
      confidenceThreshold: 0.8,
      autoProcess: true,
      batchSize: 5,
      emailNotifications: true,
      systemNotifications: true,
      completionNotifications: true,
      errorNotifications: true,
      sessionTimeout: 60,
      requireReauth: false,
      auditLogging: true,
      apiTimeout: 30,
      retryAttempts: 3,
      cacheEnabled: true
    })
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'speech-analytics-settings.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string)
        setSettings({ ...settings, ...importedSettings })
      } catch (err) {
        setError('Invalid settings file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Configure your Speech Analytics preferences and system settings
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert className="mb-4" variant="default">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Settings saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveSettings} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
            
            <Button variant="outline" onClick={resetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            
            <Button variant="outline" onClick={exportSettings}>
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import Settings
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                />
              </label>
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Preferences
                </CardTitle>
                <CardDescription>
                  Configure basic application settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={settings.language} onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, language: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="kz">Қазақша</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={settings.theme} onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, theme: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, timezone: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC+3">UTC+3 (Moscow)</SelectItem>
                        <SelectItem value="UTC+6">UTC+6 (Almaty)</SelectItem>
                        <SelectItem value="UTC+0">UTC+0 (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-save</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically save changes as you work
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoSave: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Processing Settings */}
          <TabsContent value="processing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Audio Processing Settings
                </CardTitle>
                <CardDescription>
                  Configure audio transcription and analysis settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultModel">Default Transcription Model</Label>
                    <Select value={settings.defaultModel} onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, defaultModel: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whisper-large-v3">Whisper Large v3 (Recommended)</SelectItem>
                        <SelectItem value="whisper-medium">Whisper Medium</SelectItem>
                        <SelectItem value="whisper-small">Whisper Small</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batchSize">Batch Processing Size</Label>
                    <Select value={settings.batchSize.toString()} onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, batchSize: parseInt(value) }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 file</SelectItem>
                        <SelectItem value="3">3 files</SelectItem>
                        <SelectItem value="5">5 files</SelectItem>
                        <SelectItem value="10">10 files</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confidence Threshold: {(settings.confidenceThreshold * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[settings.confidenceThreshold]}
                    onValueChange={([value]) => 
                      setSettings(prev => ({ ...prev, confidenceThreshold: value }))
                    }
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Minimum confidence level for analysis results
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-process uploads</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically start processing when files are uploaded
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoProcess}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoProcess: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </div>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">System Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Show browser notifications
                      </div>
                    </div>
                    <Switch
                      checked={settings.systemNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, systemNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Processing Completion</Label>
                      <div className="text-sm text-muted-foreground">
                        Notify when analysis is complete
                      </div>
                    </div>
                    <Switch
                      checked={settings.completionNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, completionNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Error Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Notify when errors occur
                      </div>
                    </div>
                    <Switch
                      checked={settings.errorNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, errorNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Privacy
                </CardTitle>
                <CardDescription>
                  Manage security settings and data privacy options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Session Timeout: {settings.sessionTimeout} minutes</Label>
                  <Slider
                    value={[settings.sessionTimeout]}
                    onValueChange={([value]) => 
                      setSettings(prev => ({ ...prev, sessionTimeout: value }))
                    }
                    min={15}
                    max={240}
                    step={15}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    How long before you're automatically logged out
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Require Re-authentication</Label>
                      <div className="text-sm text-muted-foreground">
                        Require password for sensitive operations
                      </div>
                    </div>
                    <Switch
                      checked={settings.requireReauth}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, requireReauth: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Audit Logging</Label>
                      <div className="text-sm text-muted-foreground">
                        Log user actions for security audit
                      </div>
                    </div>
                    <Switch
                      checked={settings.auditLogging}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, auditLogging: checked }))
                      }
                    />
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All audio data is processed securely and is never stored permanently on our servers.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Advanced configuration options for power users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>API Timeout: {settings.apiTimeout} seconds</Label>
                    <Slider
                      value={[settings.apiTimeout]}
                      onValueChange={([value]) => 
                        setSettings(prev => ({ ...prev, apiTimeout: value }))
                      }
                      min={10}
                      max={120}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Retry Attempts: {settings.retryAttempts}</Label>
                    <Slider
                      value={[settings.retryAttempts]}
                      onValueChange={([value]) => 
                        setSettings(prev => ({ ...prev, retryAttempts: value }))
                      }
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Caching</Label>
                    <div className="text-sm text-muted-foreground">
                      Cache API responses for better performance
                    </div>
                  </div>
                  <Switch
                    checked={settings.cacheEnabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, cacheEnabled: checked }))
                    }
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Changing these settings may affect application performance. 
                    Only modify if you understand the implications.
                  </AlertDescription>
                </Alert>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="destructive">Danger Zone</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-red-800">Clear All Data</h4>
                        <p className="text-sm text-red-600">
                          This will delete all projects, analyses, and settings
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 