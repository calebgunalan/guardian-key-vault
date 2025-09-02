import { DocumentManager } from '@/components/resources/DocumentManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Resources() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Protected Resources</h1>
        </div>
        <p className="text-muted-foreground">
          Access and manage protected company resources. All access is monitored and logged for security compliance.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-muted p-4 rounded-lg">
          <h2 className="font-semibold mb-2">What are Protected Resources?</h2>
          <p className="text-sm text-muted-foreground mb-3">
            This IAM (Identity and Access Management) system protects sensitive company resources including documents, 
            databases, applications, and other digital assets. Access is controlled through user roles, permissions, 
            and zero-trust policies.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span><strong>Documents:</strong> Classified company files and reports</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span><strong>Applications:</strong> Internal business applications</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span><strong>Data:</strong> Customer and business databases</span>
            </div>
          </div>
        </div>

        <DocumentManager />
      </div>
    </div>
  );
}