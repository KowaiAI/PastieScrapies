import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
import { 
  Search, 
  BarChart3, 
  Activity, 
  FileText, 
  Clock, 
  TrendingUp,
  Play,
  Pause,
  Square,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Globe,
  Zap,
  Calendar,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Mock data for charts (will be replaced with real data)
const activityData = [
  { date: '2025-01-01', searches: 12, results: 156 },
  { date: '2025-01-02', searches: 19, results: 234 },
  { date: '2025-01-03', searches: 8, results: 98 },
  { date: '2025-01-04', searches: 15, results: 187 },
  { date: '2025-01-05', searches: 22, results: 298 },
  { date: '2025-01-06', searches: 18, results: 221 },
  { date: '2025-01-07', searches: 25, results: 334 }
]

const fileTypeData = [
  { name: 'Text Files', value: 45, color: '#3b82f6' },
  { name: 'JSON', value: 25, color: '#10b981' },
  { name: 'Python', value: 15, color: '#f59e0b' },
  { name: 'JavaScript', value: 10, color: '#ef4444' },
  { name: 'Other', value: 5, color: '#8b5cf6' }
]

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentSessions, setRecentSessions] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch dashboard stats
        const statsData = await apiService.getDashboardStats()
        setStats(statsData)
        
        // Fetch recent sessions
        const sessionsData = await apiService.getRecentSessions()
        setRecentSessions(sessionsData)
        
        // Fetch services
        const servicesData = await apiService.getServices()
        setServices(servicesData)
        
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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

  const getStatusBadge = (status) => {
    const variants = {
      'completed': 'default',
      'running': 'secondary',
      'error': 'destructive',
      'paused': 'outline',
      'pending': 'outline'
    }
    return variants[status] || 'default'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">Failed to load dashboard: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
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
                <span className="text-xl font-bold">Pastie Scrapie</span>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className="text-primary font-medium">Dashboard</Link>
                <Link to="/scraper" className="text-muted-foreground hover:text-foreground">Scraper</Link>
                <Link to="/history" className="text-muted-foreground hover:text-foreground">History</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}!</h1>
          <p className="text-muted-foreground">Monitor your pastebin scraping operations and analyze security findings.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_searches || 0}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Results</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_results || 0}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Crawls</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_crawls || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.success_rate?.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Search Sessions</CardTitle>
                    <CardDescription>Your latest scraping activities</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/history">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSessions.length > 0 ? (
                    recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{session.name}</h4>
                            <Badge variant={getStatusBadge(session.status)}>
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.search_terms?.slice(0, 3).join(', ')}
                            {session.search_terms?.length > 3 && ` +${session.search_terms.length - 3} more`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {session.results_count} results • {formatDate(session.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/history`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No search sessions yet</p>
                      <Button className="mt-4" asChild>
                        <Link to="/scraper">Start Your First Search</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Search Activity</CardTitle>
                <CardDescription>Daily search and results trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="searches" 
                        stackId="1" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6}
                        name="Searches"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="results" 
                        stackId="2" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.6}
                        name="Results"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <Link to="/scraper">
                    <Search className="h-4 w-4 mr-2" />
                    New Search
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/history">
                    <Clock className="h-4 w-4 mr-2" />
                    View History
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Service Status */}
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
                <CardDescription>Pastebin service availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {services.slice(0, 5).map((service) => (
                    <div key={service.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(service.status)}
                        <span className="text-sm font-medium">{service.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {service.success_rate?.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* File Types Chart */}
            <Card>
              <CardHeader>
                <CardTitle>File Types Found</CardTitle>
                <CardDescription>Distribution of discovered file types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fileTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {fileTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {fileTypeData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

