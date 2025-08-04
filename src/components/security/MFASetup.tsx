import { useState } from "react";
import { useMFA } from "@/hooks/useMFA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Shield, ShieldCheck, Copy, RefreshCw } from "lucide-react";

export function MFASetup() {
  const { mfaSettings, loading, setupMFA, verifyAndEnableMFA, disableMFA, regenerateBackupCodes } = useMFA();
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [setupLoading, setSetupLoading] = useState(false);

  const handleSetupMFA = async () => {
    setSetupLoading(true);
    try {
      const result = await setupMFA();
      setQrCodeUrl(result.qrCodeUrl);
      setBackupCodes(result.backupCodes);
      setStep('verify');
      toast.success('MFA setup initiated. Scan the QR code with your authenticator app.');
    } catch (error) {
      toast.error('Failed to setup MFA. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!verificationCode) {
      toast.error('Please enter the verification code from your authenticator app.');
      return;
    }

    setSetupLoading(true);
    try {
      await verifyAndEnableMFA(verificationCode);
      setStep('complete');
      toast.success('MFA enabled successfully!');
    } catch (error) {
      toast.error('Invalid verification code. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!confirm('Are you sure you want to disable MFA? This will make your account less secure.')) {
      return;
    }

    setSetupLoading(true);
    try {
      await disableMFA();
      setStep('setup');
      toast.success('MFA disabled successfully.');
    } catch (error) {
      toast.error('Failed to disable MFA. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!confirm('Are you sure you want to regenerate backup codes? Old codes will no longer work.')) {
      return;
    }

    setSetupLoading(true);
    try {
      const newCodes = await regenerateBackupCodes();
      setBackupCodes(newCodes);
      toast.success('Backup codes regenerated successfully.');
    } catch (error) {
      toast.error('Failed to regenerate backup codes.');
    } finally {
      setSetupLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return <div>Loading MFA settings...</div>;
  }

  if (mfaSettings?.is_enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            Multi-Factor Authentication
          </CardTitle>
          <CardDescription>
            MFA is enabled on your account for enhanced security.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Enabled
              </Badge>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleRegenerateBackupCodes} disabled={setupLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Backup Codes
              </Button>
              <Button variant="destructive" onClick={handleDisableMFA} disabled={setupLoading}>
                Disable MFA
              </Button>
            </div>
          </div>

          {backupCodes.length > 0 && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">New Backup Codes Generated:</p>
                  <div className="grid grid-cols-2 gap-2 max-w-md">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm font-mono">
                        {code}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Save these codes in a secure location. Each code can only be used once.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Multi-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account with MFA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'setup' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Multi-factor authentication adds an extra layer of security to your account by requiring
              a code from your authenticator app in addition to your password.
            </p>
            <Button onClick={handleSetupMFA} disabled={setupLoading}>
              {setupLoading ? 'Setting up...' : 'Enable MFA'}
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium mb-4">
                Scan this QR code with your authenticator app:
              </p>
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="MFA QR Code" className="mx-auto mb-4 border rounded" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Enter verification code from your app:</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleVerifyMFA} disabled={setupLoading}>
                {setupLoading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
              <Button variant="outline" onClick={() => setStep('setup')}>
                Cancel
              </Button>
            </div>

            {backupCodes.length > 0 && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Backup Codes (save these securely):</p>
                    <div className="grid grid-cols-2 gap-2 max-w-md">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm font-mono">
                          {code}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}