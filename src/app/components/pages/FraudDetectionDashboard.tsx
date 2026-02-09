import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertTriangle, Shield, CheckCircle2, XCircle, Search, Filter, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function FraudDetectionDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    severity: 'all',
    entityType: 'all',
    status: 'detected'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.severity !== 'all') params.append('severity', filter.severity);
      if (filter.entityType !== 'all') params.append('entity_type', filter.entityType);
      
      const result = await api.get(`/live_photo_verification.php?fraud_logs&${params.toString()}`);
      
      if (result.success) {
        setLogs(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveLog = async (logId: number, actionTaken: string) => {
    try {
      const result = await api.post('/live_photo_verification.php', {
        action: 'resolve_fraud_log',
        log_id: logId,
        action_taken: actionTaken,
        status: 'resolved'
      });

      if (result.success) {
        toast.success('Fraud log resolved');
        fetchLogs();
      } else {
        toast.error(result.message || 'Failed to resolve log');
      }
    } catch (error) {
      toast.error('Error resolving log');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return log.entity_type.toLowerCase().includes(search) ||
             log.detection_type.toLowerCase().includes(search) ||
             log.entity_id.toString().includes(search);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Detections</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {logs.filter(l => l.severity === 'critical').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-orange-600">
                  {logs.filter(l => l.severity === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter(l => l.status === 'resolved').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Fraud Detection Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filter.severity} onValueChange={(value) => setFilter({...filter, severity: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.entityType} onValueChange={(value) => setFilter({...filter, entityType: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="review">Review</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.status} onValueChange={(value) => setFilter({...filter, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detected">Detected</SelectItem>
                <SelectItem value="investigated">Investigated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Indicators</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.detection_type}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.entity_type}</div>
                          <div className="text-muted-foreground">ID: {log.entity_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.risk_score}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {JSON.parse(log.indicators).slice(0, 2).map((indicator: string, i: number) => (
                            <div key={i} className="text-xs text-muted-foreground truncate">
                              • {indicator}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {log.status === 'detected' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveLog(log.id, 'Reviewed and resolved')}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        )}
                        {log.status === 'resolved' && (
                          <Badge variant="secondary">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
