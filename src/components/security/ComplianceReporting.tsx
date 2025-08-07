import { useState } from "react";
import { useComplianceReports } from "@/hooks/useComplianceReports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Download, Trash2, BarChart3, Shield, Users, Activity, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const reportTypeLabels = {
  access_review: "Access Review",
  permission_audit: "Permission Audit",
  login_activity: "Login Activity",
  failed_logins: "Failed Logins",
  privileged_access: "Privileged Access"
};

const reportTypeIcons = {
  access_review: Users,
  permission_audit: Shield,
  login_activity: Activity,
  failed_logins: AlertCircle,
  privileged_access: BarChart3
};

export default function ComplianceReporting() {
  const {
    reports,
    loading,
    generateAccessReviewReport,
    generatePermissionAuditReport,
    generateLoginActivityReport,
    generatePrivilegedAccessReport,
    deleteReport,
    exportReport
  } = useComplianceReports();

  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      switch (selectedReportType) {
        case 'access_review':
          await generateAccessReviewReport(dateRange.start, dateRange.end);
          break;
        case 'permission_audit':
          await generatePermissionAuditReport();
          break;
        case 'login_activity':
          if (!dateRange.start || !dateRange.end) {
            throw new Error("Date range is required for login activity reports");
          }
          await generateLoginActivityReport(dateRange.start, dateRange.end);
          break;
        case 'privileged_access':
          await generatePrivilegedAccessReport();
          break;
        default:
          throw new Error("Please select a report type");
      }

      toast.success("Compliance report generated successfully");
      setIsGenerateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      toast.success("Report deleted successfully");
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  const handleExportReport = (report: any, format: 'json' | 'csv') => {
    try {
      exportReport(report, format);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const resetForm = () => {
    setSelectedReportType("");
    setDateRange({ start: "", end: "" });
  };

  const requiresDateRange = selectedReportType === 'login_activity';

  const getReportSummary = (report: any) => {
    const { report_data } = report;
    
    switch (report.report_type) {
      case 'access_review':
        return `${report_data.total_users} users, ${report_data.users_with_roles} with roles`;
      case 'permission_audit':
        return `${report_data.total_permissions} permissions, ${report_data.role_assignments} role assignments`;
      case 'login_activity':
        return `${report_data.total_login_events} events, ${report_data.unique_users} unique users`;
      case 'privileged_access':
        return `${report_data.privileged_users_count} privileged users`;
      default:
        return 'Generated compliance report';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate Report Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Compliance Reporting</span>
              </CardTitle>
              <CardDescription>
                Generate compliance reports for auditing and regulatory requirements
              </CardDescription>
            </div>
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Compliance Report</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGenerateReport} className="space-y-4">
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="access_review">Access Review Report</SelectItem>
                        <SelectItem value="permission_audit">Permission Audit Report</SelectItem>
                        <SelectItem value="login_activity">Login Activity Report</SelectItem>
                        <SelectItem value="privileged_access">Privileged Access Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {requiresDateRange && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="datetime-local"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          required={requiresDateRange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="datetime-local"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          required={requiresDateRange}
                        />
                      </div>
                    </div>
                  )}

                  {selectedReportType && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Report Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedReportType === 'access_review' && 
                          "Reviews all user accounts, their assigned roles, and group memberships for access compliance verification."}
                        {selectedReportType === 'permission_audit' && 
                          "Audits all permissions, their assignments to roles and groups, identifying potential security risks."}
                        {selectedReportType === 'login_activity' && 
                          "Analyzes login patterns, successful and failed authentication attempts within the specified time period."}
                        {selectedReportType === 'privileged_access' && 
                          "Reviews all users with elevated privileges including admin and moderator roles."}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={generating}>
                      {generating ? "Generating..." : "Generate Report"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>View and export previously generated compliance reports</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No reports generated</h3>
              <p className="text-muted-foreground mb-4">Generate your first compliance report</p>
              <Button onClick={() => setIsGenerateDialogOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const IconComponent = reportTypeIcons[report.report_type];
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{reportTypeLabels[report.report_type]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={getReportSummary(report)}>
                          {getReportSummary(report)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.date_range_start && report.date_range_end ? (
                          <div className="text-sm">
                            <div>{new Date(report.date_range_start).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              to {new Date(report.date_range_end).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{report.generator_profile?.email}</TableCell>
                      <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportReport(report, 'json')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            JSON
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportReport(report, 'csv')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this compliance report? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReport(report.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}