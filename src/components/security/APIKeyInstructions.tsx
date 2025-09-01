import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Key, Code, Shield, Zap, Lock, Globe } from 'lucide-react';

export function APIKeyInstructions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key Usage Guide
        </CardTitle>
        <CardDescription>
          Learn how to use API keys for programmatic access to your account and resources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* What are API Keys */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            What are API Keys?
          </h3>
          <p className="text-muted-foreground">
            API keys are secure tokens that allow external applications, scripts, or services to interact 
            with your IAM system programmatically. They provide a secure way to authenticate and authorize 
            automated access to your resources without exposing your login credentials.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-green-500" />
                <span className="font-medium">Security Benefits</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• No password exposure in code</li>
                <li>• Granular permission control</li>
                <li>• Easy rotation and revocation</li>
                <li>• Audit trail for all API usage</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Use Cases</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automated user provisioning</li>
                <li>• CI/CD pipeline integrations</li>
                <li>• Monitoring and alerting systems</li>
                <li>• Third-party application access</li>
              </ul>
            </div>
          </div>
        </div>

        <Separator />

        {/* How to Use API Keys */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            How to Use API Keys
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">1. Include API Key in Headers</h4>
              <div className="bg-black p-3 rounded text-sm font-mono text-green-400">
                <div>curl -H "Authorization: Bearer YOUR_API_KEY" \</div>
                <div className="ml-4">https://api.yourcompany.com/users</div>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">2. JavaScript/Node.js Example</h4>
              <div className="bg-black p-3 rounded text-sm font-mono text-green-400">
                <div>const response = await fetch('/api/users', {'{'}</div>
                <div className="ml-2">headers: {'{'}</div>
                <div className="ml-4">'Authorization': 'Bearer YOUR_API_KEY',</div>
                <div className="ml-4">'Content-Type': 'application/json'</div>
                <div className="ml-2">{'}'}</div>
                <div>{'});'}</div>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">3. Python Example</h4>
              <div className="bg-black p-3 rounded text-sm font-mono text-green-400">
                <div>import requests</div>
                <div></div>
                <div>headers = {'{"Authorization": "Bearer YOUR_API_KEY"}'}</div>
                <div>response = requests.get('https://api.yourcompany.com/users', headers=headers)</div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Available Endpoints */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Available API Endpoints
          </h3>
          
          <div className="space-y-3">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">User Management</span>
                <Badge variant="outline">GET, POST, PUT, DELETE</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div><code className="bg-muted px-1 rounded">GET /api/users</code> - List all users</div>
                <div><code className="bg-muted px-1 rounded">POST /api/users</code> - Create new user</div>
                <div><code className="bg-muted px-1 rounded">PUT /api/users/:id</code> - Update user</div>
                <div><code className="bg-muted px-1 rounded">DELETE /api/users/:id</code> - Delete user</div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Role Management</span>
                <Badge variant="outline">GET, PUT</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div><code className="bg-muted px-1 rounded">GET /api/roles</code> - List available roles</div>
                <div><code className="bg-muted px-1 rounded">PUT /api/users/:id/role</code> - Update user role</div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Audit Logs</span>
                <Badge variant="outline">GET</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div><code className="bg-muted px-1 rounded">GET /api/audit-logs</code> - Retrieve audit logs</div>
                <div><code className="bg-muted px-1 rounded">GET /api/audit-logs/export</code> - Export logs</div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Security Analytics</span>
                <Badge variant="outline">GET</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div><code className="bg-muted px-1 rounded">GET /api/security/attacks</code> - Security incident data</div>
                <div><code className="bg-muted px-1 rounded">GET /api/security/risk-scores</code> - User risk assessments</div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Security Best Practices */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Security Best Practices</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">✅ Do</h4>
              <ul className="text-sm space-y-2">
                <li>• Store API keys in environment variables</li>
                <li>• Use HTTPS for all API requests</li>
                <li>• Rotate keys regularly (every 90 days)</li>
                <li>• Use minimum required permissions</li>
                <li>• Monitor API key usage in audit logs</li>
                <li>• Revoke unused or compromised keys immediately</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-red-600">❌ Don't</h4>
              <ul className="text-sm space-y-2">
                <li>• Hard-code API keys in source code</li>
                <li>• Share API keys via email or chat</li>
                <li>• Use the same key across multiple applications</li>
                <li>• Grant overly broad permissions</li>
                <li>• Ignore rate limiting warnings</li>
                <li>• Log API keys in application logs</li>
              </ul>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rate Limiting */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Rate Limiting & Quotas</h3>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Rate Limits</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              API keys are subject to rate limiting to ensure fair usage and system stability.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-white dark:bg-gray-900 rounded border">
                <div className="font-medium">Default Limit</div>
                <div className="text-2xl font-bold text-blue-600">1000</div>
                <div className="text-muted-foreground">requests/hour</div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-900 rounded border">
                <div className="font-medium">Burst Limit</div>
                <div className="text-2xl font-bold text-orange-600">100</div>
                <div className="text-muted-foreground">requests/minute</div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-900 rounded border">
                <div className="font-medium">Concurrent</div>
                <div className="text-2xl font-bold text-green-600">10</div>
                <div className="text-muted-foreground">connections</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}