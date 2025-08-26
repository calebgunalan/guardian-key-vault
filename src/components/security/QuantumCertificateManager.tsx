import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useQuantumPKI } from '@/hooks/useQuantumPKI';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, Trash2, RefreshCw, Download, Key, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface CertificateRequest {
  certificateType: 'signing' | 'encryption' | 'authentication';
  validityDays: number;
  keySize: 2048 | 3072 | 4096;
  subject: string;
}

export function QuantumCertificateManager() {
  const { certificates, loading, requestCertificate, revokeCertificate, exportCertificate } = useQuantumPKI();
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [certificateRequest, setCertificateRequest] = useState<CertificateRequest>({
    certificateType: 'signing',
    validityDays: 365,
    keySize: 2048,
    subject: ''
  });

  const handleRequestCertificate = async () => {
    try {
      await requestCertificate(
        certificateRequest.certificateType,
        certificateRequest.subject,
        certificateRequest.validityDays
      );
      
      toast({
        title: "Certificate Generated",
        description: "Your quantum-safe certificate has been successfully generated"
      });
      
      setIsRequestDialogOpen(false);
      setCertificateRequest({
        certificateType: 'signing',
        validityDays: 365,
        keySize: 2048,
        subject: ''
      });
    } catch (error) {
      toast({
        title: "Certificate Generation Failed",
        description: "Failed to generate certificate. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRevokeCertificate = async (certificateId: string) => {
    try {
      await revokeCertificate(certificateId, 'User requested revocation');
      toast({
        title: "Certificate Revoked",
        description: "The certificate has been successfully revoked"
      });
    } catch (error) {
      toast({
        title: "Revocation Failed",
        description: "Failed to revoke certificate. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateCertificate = async (certificateId: string, certificateType: string, subject: string) => {
    try {
      // First revoke the old certificate
      await revokeCertificate(certificateId, 'Certificate regenerated');
      
      // Generate a new one with the same parameters
      await requestCertificate(
        certificateType as 'signing' | 'encryption' | 'authentication',
        subject,
        365 // Default 1 year validity
      );
      
      toast({
        title: "Certificate Regenerated",
        description: "A new certificate has been generated to replace the old one"
      });
    } catch (error) {
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate certificate. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportCertificate = async (certificateId: string) => {
    try {
      const exportData = await exportCertificate(certificateId);
      
      // Create and download the certificate file
      const blob = new Blob([exportData], { type: 'application/x-pem-file' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quantum-certificate-${certificateId.slice(0, 8)}.pem`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Certificate Exported",
        description: "Certificate has been downloaded to your device"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export certificate. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCertificateStatus = (cert: any): { status: string, color: "default" | "destructive" | "secondary" | "outline" } => {
    if (cert.is_revoked) return { status: 'revoked', color: 'destructive' };
    
    const now = new Date();
    const validUntil = new Date(cert.valid_until);
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) return { status: 'expired', color: 'destructive' };
    if (daysUntilExpiry <= 30) return { status: 'expiring', color: 'secondary' };
    return { status: 'valid', color: 'default' };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quantum Certificate Management
              </CardTitle>
              <CardDescription>
                Manage quantum-safe digital certificates for secure communications and authentication
              </CardDescription>
            </div>
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Certificate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request New Quantum Certificate</DialogTitle>
                  <DialogDescription>
                    Generate a new quantum-safe certificate for secure operations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Certificate Type</Label>
                    <Select 
                      value={certificateRequest.certificateType}
                      onValueChange={(value: any) => setCertificateRequest(prev => ({ ...prev, certificateType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="signing">Digital Signing</SelectItem>
                        <SelectItem value="encryption">Data Encryption</SelectItem>
                        <SelectItem value="authentication">Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Subject (Certificate Name)</Label>
                    <Input
                      value={certificateRequest.subject}
                      onChange={(e) => setCertificateRequest(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., user@company.com or Company Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Validity Period</Label>
                    <Select 
                      value={certificateRequest.validityDays.toString()}
                      onValueChange={(value) => setCertificateRequest(prev => ({ ...prev, validityDays: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">3 Months</SelectItem>
                        <SelectItem value="180">6 Months</SelectItem>
                        <SelectItem value="365">1 Year</SelectItem>
                        <SelectItem value="730">2 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Key Size</Label>
                    <Select 
                      value={certificateRequest.keySize.toString()}
                      onValueChange={(value) => setCertificateRequest(prev => ({ ...prev, keySize: parseInt(value) as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2048">2048-bit (Standard)</SelectItem>
                        <SelectItem value="3072">3072-bit (Enhanced)</SelectItem>
                        <SelectItem value="4096">4096-bit (Maximum)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRequestCertificate}>
                    Generate Certificate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Certificate Information */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What are Quantum Certificates?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Quantum certificates use post-quantum cryptographic algorithms that remain secure even against 
                quantum computer attacks. They provide digital identity verification, data encryption, and 
                secure communications that will be safe in the quantum computing era.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Digital Signing:</strong> Create tamper-proof digital signatures for documents and transactions
                </div>
                <div>
                  <strong>Data Encryption:</strong> Protect sensitive data with quantum-safe encryption algorithms
                </div>
                <div>
                  <strong>Authentication:</strong> Verify identity and establish secure connections
                </div>
              </div>
            </div>

            {/* Certificates Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid From</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : certificates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No certificates found. Click "Request Certificate" to generate your first quantum-safe certificate.
                      </TableCell>
                    </TableRow>
                  ) : (
                    certificates.map((cert) => {
                      const status = getCertificateStatus(cert);
                      return (
                        <TableRow key={cert.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{cert.subject}</p>
                                <p className="text-sm text-muted-foreground">
                                  Serial: {cert.serial_number?.slice(0, 16)}...
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{cert.certificate_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {status.status === 'valid' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Badge variant={status.color}>{status.status}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {new Date(cert.valid_from).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {new Date(cert.valid_until).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportCertificate(cert.id)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              
                              {!cert.is_revoked && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRegenerateCertificate(cert.id, cert.certificate_type, cert.subject)}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              )}

                              {!cert.is_revoked && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Revoke Certificate</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to revoke this certificate? This action cannot be undone 
                                        and will immediately invalidate all uses of this certificate.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRevokeCertificate(cert.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Revoke Certificate
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}