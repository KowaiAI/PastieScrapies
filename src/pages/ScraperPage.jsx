import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
import { 
  Search, 
  Play, 
  Square, 
  Pause,
  Settings,
  Terminal,
  FileText,
  Globe,
  Clock,
  Zap,
  Filter,
  Download,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  ArrowLeft,
  Copy,
  Trash2,
  Plus,
  X
} from 'lucide-react'

const fileTypes = [
  { id: 'txt', name: 'Text Files', extension: '.txt' },
  { id: 'json', name: 'JSON', extension: '.json' },
  { id: 'py', name: 'Python', extension: '.py' },
  { id: 'js', name: 'JavaScript', extension: '.js' },
  { id: 'php', name: 'PHP', extension: '.php' },
  { id: 'sql', name: 'SQL', extension: '.sql' },
  { id: 'xml', name: 'XML', extension: '.xml' },
  { id: 'html', name: 'HTML', extension: '.html' },
  { id: 'css', name: 'CSS', extension: '.css' },
  { id: 'java', name: 'Java', extension: '.java' },
  { id: 'cpp', name: 'C++', extension: '.cpp' },
  { id: 'sh', name: 'Shell Script', extension: '.sh' }
]

const ScraperPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  // State management
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [searchTerms, setSearchTerms] = useState([''])
  const [selectedFileTypes, setSelectedFileTypes] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [services, setServices] = useState([])
  const [logs, setLogs] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [currentStats, setCurrentStats] = useState({
    servicesScanned: 0,
    totalServices: 0,
    resultsFound: 0,
    timeElapsed: 0,
    estimatedTimeRemaining: 0
  })
  
  // Advanced settings
  const [advancedSettings, setAdvancedSettings] = useState({
    maxResults: 1000,
    rateLimit: 30,
    includeExpired: false,
    regexMode: false,
    minFileSize: 0,
    maxFileSize: 10000,
    dateRange: 'all',
    excludeTerms: []
  })

  // Fetch services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await apiService.getServices()
        setServices(servicesData)
        // Select active services by default
        const activeServices = servicesData
          .filter(service => service.status === 'active')
          .slice(0, 5) // Limit to first 5 active services
          .map(service => service.id)
        setSelectedServices(activeServices)
      } catch (err) {
        console.error('Failed to fetch services:', err)
        setError('Failed to load pastebin services')
      }
    }

    fetchServices()
  }, [])

  // Poll session status when running
  useEffect(() => {
    if (currentSession && isRunning) {
      const pollSession = () => {
        apiService.pollSessionStatus(currentSession.id, (session) => {
          setCurrentSession(session)
          setCurrentStats(prev => ({
            ...prev,
            resultsFound: session.results_count || 0,
            timeElapsed: session.duration || 0
          }))
          
          if (session.status === 'completed' || session.status === 'error') {
            setIsRunning(false)
            setIsPaused(false)
          }
        })
      }

      const pollLogs = () => {
        apiService.pollSessionLogs(currentSession.id, (logs) => {
          setLogs(logs)
        })
      }

      pollSession()
      pollLogs()
    }
  }, [currentSession, isRunning])

  const addSearchTerm = () => {
    setSearchTerms([...searchTerms, ''])
  }

  const removeSearchTerm = (index) => {
    if (searchTerms.length > 1) {
      setSearchTerms(searchTerms.filter((_, i) => i !== index))
    }
  }

  const updateSearchTerm = (index, value) => {
    const newTerms = [...searchTerms]
    newTerms[index] = value
    setSearchTerms(newTerms)
  }

  const toggleService = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const toggleFileType = (fileTypeId) => {
    setSelectedFileTypes(prev => 
      prev.includes(fileTypeId) 
        ? prev.filter(id => id !== fileTypeId)
        : [...prev, fileTypeId]
    )
  }

  const validateForm = () => {
    if (!sessionName.trim()) {
      setError('Session name is required')
      return false
    }
    
    const validTerms = searchTerms.filter(term => term.trim())
    if (validTerms.length === 0) {
      setError('At least one search term is required')
      return false
    }
    
    if (selectedServices.length === 0) {
      setError('At least one pastebin service must be selected')
      return false
    }
    
    return true
  }

  const startScraping = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)
      
      const validTerms = searchTerms.filter(term => term.trim())
      
      // Create session
      const sessionData = {
        name: sessionName,
        search_terms: validTerms,
        file_types: selectedFileTypes,
        services: selectedServices,
        settings: advancedSettings
      }
      
      const session = await apiService.createSession(sessionData)
      setCurrentSession(session)
      
      // Start the session
      await apiService.startSession(session.id)
      
      setIsRunning(true)
      setIsPaused(false)
      setCurrentStats({
        servicesScanned: 0,
        totalServices: selectedServices.length,
        resultsFound: 0,
        timeElapsed: 0,
        estimatedTimeRemaining: 0
      })
      
      // Clear logs
      setLogs([])
      
    } catch (err) {
      console.error('Failed to start scraping:', err)
      setError(err.message || 'Failed to start scraping session')
    } finally {
      setLoading(false)
    }
  }

  const stopScraping = async () => {
    if (!currentSession) return

    try {
      await apiService.stopSession(currentSession.id)
      setIsRunning(false)
      setIsPaused(false)
    } catch (err) {
      console.error('Failed to stop session:', err)
      setError('Failed to stop scraping session')
    }
  }

  const pauseScraping = () => {
    setIsPaused(!isPaused)
    // Note: Actual pause/resume would need backend support
  }

  const resetForm = () => {
    setSessionName('')
    setSearchTerms([''])
    setSelectedFileTypes([])
    setSelectedServices(services.filter(s => s.status === 'active').slice(0, 5).map(s => s.id))
    setLogs([])
    setCurrentSession(null)
    setIsRunning(false)
    setIsPaused(false)
    setError(null)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getLogIcon = (level) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      default:
        return <Activity className="h-3 w-3 text-blue-500" />
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <Search className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">PasteBin Scraper</span>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
                <Link to="/scraper" className="text-primary font-medium">Scraper</Link>
                <Link to="/history" className="text-muted-foreground hover:text-foreground">History</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Pastebin Scraper</h1>
                <p className="text-muted-foreground">Configure and run your pastebin search operations</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={resetForm} disabled={isRunning}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Session Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Session Configuration</CardTitle>
                <CardDescription>Set up your search session parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Session Name */}
                <div className="space-y-2">
                  <Label htmlFor="session-name">Session Name</Label>
                  <Input
                    id="session-name"
                    placeholder="e.g., API Keys Security Scan"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    disabled={isRunning}
                  />
                </div>

                {/* Search Terms */}
                <div className="space-y-2">
                  <Label>Search Terms</Label>
                  <div className="space-y-2">
                    {searchTerms.map((term, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="Enter search term..."
                          value={term}
                          onChange={(e) => updateSearchTerm(index, e.target.value)}
                          disabled={isRunning}
                        />
                        {searchTerms.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSearchTerm(index)}
                            disabled={isRunning}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSearchTerm}
                      disabled={isRunning}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Term
                    </Button>
                  </div>
                </div>

                {/* File Types */}
                <div className="space-y-2">
                  <Label>File Types (Optional)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {fileTypes.map((fileType) => (
                      <div key={fileType.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={fileType.id}
                          checked={selectedFileTypes.includes(fileType.id)}
                          onCheckedChange={() => toggleFileType(fileType.id)}
                          disabled={isRunning}
                        />
                        <Label htmlFor={fileType.id} className="text-sm">
                          {fileType.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pastebin Services */}
                <div className="space-y-2">
                  <Label>Pastebin Services</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={service.id}
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => toggleService(service.id)}
                            disabled={isRunning}
                          />
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(service.status)}
                            <Label htmlFor={service.id} className="text-sm font-medium">
                              {service.name}
                            </Label>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {service.has_api && (
                            <Badge variant="secondary" className="text-xs">API</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {service.rate_limit}/min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Settings */}
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList>
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Results</Label>
                        <Input
                          type="number"
                          value={advancedSettings.maxResults}
                          onChange={(e) => setAdvancedSettings(prev => ({
                            ...prev,
                            maxResults: parseInt(e.target.value) || 1000
                          }))}
                          disabled={isRunning}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Rate Limit (req/min)</Label>
                        <Input
                          type="number"
                          value={advancedSettings.rateLimit}
                          onChange={(e) => setAdvancedSettings(prev => ({
                            ...prev,
                            rateLimit: parseInt(e.target.value) || 30
                          }))}
                          disabled={isRunning}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="regex-mode"
                        checked={advancedSettings.regexMode}
                        onCheckedChange={(checked) => setAdvancedSettings(prev => ({
                          ...prev,
                          regexMode: checked
                        }))}
                        disabled={isRunning}
                      />
                      <Label htmlFor="regex-mode">Enable Regex Mode</Label>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Control Buttons */}
                <div className="flex items-center space-x-4 pt-4">
                  {!isRunning ? (
                    <Button 
                      onClick={startScraping} 
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Start Scraping
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={pauseScraping}
                        className="flex-1"
                      >
                        {isPaused ? (
                          <Play className="h-4 w-4 mr-2" />
                        ) : (
                          <Pause className="h-4 w-4 mr-2" />
                        )}
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={stopScraping}
                        className="flex-1"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={isRunning ? 'default' : 'secondary'}>
                    {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Idle'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Services</span>
                  <span className="text-sm font-medium">
                    {currentStats.servicesScanned}/{currentStats.totalServices}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Results Found</span>
                  <span className="text-sm font-medium">{currentStats.resultsFound}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time Elapsed</span>
                  <span className="text-sm font-medium">{formatTime(currentStats.timeElapsed)}</span>
                </div>

                {currentSession && (
                  <div className="pt-4">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to="/history">
                        <Eye className="h-4 w-4 mr-2" />
                        View Results
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Real-time Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Terminal className="h-5 w-5" />
                  <span>Live Logs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-2 mb-1">
                        <span className="text-gray-500 text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          {getLogIcon(log.level)}
                          <span className="text-gray-400">[{log.service}]</span>
                        </div>
                        <span className="text-green-400 flex-1">{log.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No logs yet. Start a scraping session to see real-time updates.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScraperPage

