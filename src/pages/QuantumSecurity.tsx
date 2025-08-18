import { QuantumSecurityDashboard } from '@/components/security/QuantumSecurityDashboard';
import { EnterpriseQuantumDashboard } from '@/components/security/EnterpriseQuantumDashboard';
import { TrustScoreDetails } from '@/components/TrustScoreDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function QuantumSecurity() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Management</TabsTrigger>
          <TabsTrigger value="trust-analysis">Trust Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <QuantumSecurityDashboard />
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <EnterpriseQuantumDashboard />
        </TabsContent>
        
        <TabsContent value="trust-analysis" className="space-y-4">
          <TrustScoreDetails />
        </TabsContent>
      </Tabs>
    </div>
  );
}