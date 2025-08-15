import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
import { 
  Search, 
  Filter,
  Download,
  Eye,
  Calendar,
  Clock,
  FileText,
  BarChart3,
  ArrowLeft,
  Users,
  ExternalLink,
  Copy,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw
} from 'lucide-react'

const HistoryPage = () => {
  const { user, logout } = useAuth()
  
  // State management
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionResults, setSessionResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Filters
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [resultsPage, setResultsPage] = useState(1)
  const [resultsTotalPages, setResultsTotalPages] = useState(1)

  // Fetch sessions on component mount and when filters change
  useEffect(() => {
    fetchSessions()
  }, [currentPage, searchFilter, statusFilter, dateFilter])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page: currentPage,
        per_page: 20,
        search: searchFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      }
      
      const response = await apiService.getSessions(params)
      setSessions(response.sessions || [])
      setTotalPages(response.pages || 1)
      
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      setError(err.message || 'Failed to load search history')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionResults = async (sessionId, page = 1) => {
    try {
      setResultsLoading(true)
      
      const params = {
        page: page,
        per_page: 50
      }
      
      const response = await apiService.getSessionResults(sessionId, params)
      setSessionResults(response.results || [])
      setResultsTotalPages(response.pages || 1)
      setResultsPage(page)
      
    } catch (err) {
      console.error('Failed to fetch session results:', err)
      setError('Failed to load session results')
    } finally {
      setResultsLoading(false)
    }
  }

  const deleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    try {
      await apiService.deleteSession(sessionId)
      setSessions(sessions.filter(session => session.id !== sessionId))
      
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession(null)
        setSessionResults([])
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
      setError('Failed to delete session')
    }
  }

  const exportSession = async (sessionId, format = 'json') => {
    try {
      const data = await apiService.exportSessionResults(sessionId, format)
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `session-${sessionId}-results.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export session:', err)
      setError('Failed to export session results')
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'paused':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const handleSessionClick = (session) => {
    setSelectedSession(session)
    fetchSessionResults(session.id)
  }

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading search history...</p>
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
                <span className="text-xl font-bold">PasteBin Scraper</span>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
                <Link to="/scraper" className="text-muted-foreground hover:text-foreground">Scraper</Link>
                <Link to="/history" className="text-primary font-medium">History</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportSession('all')}>
                <Download className="h-4 w-4 mr-2" />
                Export All
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search History</h1>
          <p className="text-muted-foreground">View and manage your past scraping sessions and results</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search sessions..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={fetchSessions}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearchFilter('')
                    setStatusFilter('all')
                    setDateFilter('all')
                  }}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Search Sessions ({sessions.length})</CardTitle>
                    <CardDescription>Click on a session to view detailed results</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/scraper">
                      <Play className="h-4 w-4 mr-2" />
                      New Search
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div 
                        key={session.id} 
                        className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSessionClick(session)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{session.name}</h3>
                            <Badge variant={getStatusBadge(session.status)}>
                              {session.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                exportSession(session.id)
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteSession(session.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Terms:</span> {session.search_terms?.join(', ')}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span>{session.results_count} results</span>
                            <span>{formatDuration(session.duration)}</span>
                            <span>{session.success_rate?.toFixed(1)}% success</span>
                          </div>
                          <span className="text-muted-foreground">
                            {formatDate(session.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No search sessions found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchFilter || statusFilter !== 'all' 
                        ? 'Try adjusting your filters or search terms'
                        : 'Start your first search to see results here'
                      }
                    </p>
                    <Button asChild>
                      <Link to="/scraper">
                        <Play className="h-4 w-4 mr-2" />
                        Start New Search
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Session Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
                <CardDescription>
                  {selectedSession ? 'Detailed results and information' : 'Select a session to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSession ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{selectedSession.name}</h4>
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(selectedSession.status)}
                        <Badge variant={getStatusBadge(selectedSession.status)}>
                          {selectedSession.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Results:</span>
                        <span className="font-medium">{selectedSession.results_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{formatDuration(selectedSession.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Success Rate:</span>
                        <span className="font-medium">{selectedSession.success_rate?.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">{formatDate(selectedSession.created_at)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Search Terms</h5>
                      <div className="flex flex-wrap gap-1">
                        {selectedSession.search_terms?.map((term, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {selectedSession.file_types?.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">File Types</h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedSession.file_types.map((type, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => exportSession(selectedSession.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Results
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => deleteSession(selectedSession.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Session
                      </Button>
                    </div>
                    
                    {/* Results Preview */}
                    {sessionResults.length > 0 && (
                      <div className="pt-4">
                        <h5 className="font-medium mb-2">Recent Results</h5>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {sessionResults.slice(0, 5).map((result) => (
                            <div key={result.id} className="border rounded p-2 text-xs">
                              <div className="font-medium truncate">{result.title || result.paste_id}</div>
                              <div className="text-muted-foreground truncate">
                                {result.content_preview}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {result.service}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {result.relevance_score?.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a search session from the list to view detailed information and results.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HistoryPage

