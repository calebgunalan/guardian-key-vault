import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Edit, Trash2, Download, Lock, Eye, Calendar } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description?: string;
  content: string;
  classification: 'public' | 'internal' | 'confidential' | 'secret';
  created_by: string;
  created_at: string;
  updated_at: string;
  access_count: number;
}

interface NewDocument {
  title: string;
  description: string;
  content: string;
  classification: 'public' | 'internal' | 'confidential' | 'secret';
}

export function DocumentManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState<Document | null>(null);
  const [newDocument, setNewDocument] = useState<NewDocument>({
    title: '',
    description: '',
    content: '',
    classification: 'internal'
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      // Create mock data since we don't have this table yet
      const mockDocuments: Document[] = [
        {
          id: '1',
          title: 'Security Policy Document',
          description: 'Company-wide security policies and procedures',
          content: 'This document outlines the comprehensive security policies...',
          classification: 'confidential',
          created_by: user?.id || 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          access_count: 25
        },
        {
          id: '2',
          title: 'Employee Handbook',
          description: 'Guidelines and procedures for all employees',
          content: 'Welcome to our company. This handbook contains...',
          classification: 'internal',
          created_by: user?.id || 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          access_count: 150
        },
        {
          id: '3',
          title: 'Financial Report Q4',
          description: 'Quarterly financial performance report',
          content: 'Q4 Financial Summary: Revenue increased by 15%...',
          classification: 'secret',
          created_by: user?.id || 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          access_count: 8
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    try {
      const document: Document = {
        id: Math.random().toString(36).substring(7),
        ...newDocument,
        created_by: user?.id || 'unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        access_count: 0
      };

      // Log document creation
      await supabase.rpc('log_audit_event', {
        _action: 'CREATE',
        _resource: 'document',
        _resource_id: document.id,
        _details: {
          title: document.title,
          classification: document.classification
        }
      });

      setDocuments(prev => [document, ...prev]);
      setIsAddDialogOpen(false);
      setNewDocument({
        title: '',
        description: '',
        content: '',
        classification: 'internal'
      });

      toast({
        title: "Document Created",
        description: `Document "${document.title}" has been created successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = async (document: Document) => {
    try {
      // Log document access
      await supabase.rpc('log_audit_event', {
        _action: 'VIEW',
        _resource: 'document',
        _resource_id: document.id,
        _details: {
          title: document.title,
          classification: document.classification
        }
      });

      // Increment access count
      const updatedDocument = { ...document, access_count: document.access_count + 1 };
      setDocuments(prev => prev.map(doc => doc.id === document.id ? updatedDocument : doc));
      setViewDocument(updatedDocument);
    } catch (error) {
      console.error('Error logging document access:', error);
      setViewDocument(document);
    }
  };

  const handleDeleteDocument = async (documentId: string, title: string) => {
    try {
      // Log document deletion
      await supabase.rpc('log_audit_event', {
        _action: 'DELETE',
        _resource: 'document',
        _resource_id: documentId,
        _details: {
          title: title
        }
      });

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      toast({
        title: "Document Deleted",
        description: `Document "${title}" has been deleted`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'public': return 'default';
      case 'internal': return 'secondary';
      case 'confidential': return 'destructive';
      case 'secret': return 'destructive';
      default: return 'default';
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'public': return Eye;
      case 'internal': return FileText;
      case 'confidential': return Lock;
      case 'secret': return Lock;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Management
              </CardTitle>
              <CardDescription>
                Secure document storage and access control with comprehensive audit trails
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                  <DialogDescription>
                    Add a new document with appropriate classification level
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter document title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newDocument.description}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the document"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newDocument.content}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Document content..."
                      rows={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classification">Classification Level</Label>
                    <select
                      id="classification"
                      value={newDocument.classification}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, classification: e.target.value as any }))}
                      className="w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background rounded-md"
                    >
                      <option value="public">Public</option>
                      <option value="internal">Internal</option>
                      <option value="confidential">Confidential</option>
                      <option value="secret">Secret</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDocument}>
                    Create Document
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Access Count</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No documents found. Create your first document to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((document) => {
                    const ClassificationIcon = getClassificationIcon(document.classification);
                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ClassificationIcon className="h-4 w-4" />
                            <div>
                              <p className="font-medium">{document.title}</p>
                              <p className="text-sm text-muted-foreground">{document.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getClassificationColor(document.classification)}>
                            {document.classification.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(document.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{document.access_count} views</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument(document)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{document.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteDocument(document.id, document.title)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Document
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewDocument?.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getClassificationColor(viewDocument?.classification || 'public')}>
                {viewDocument?.classification.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {viewDocument?.access_count} views
              </span>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            {viewDocument?.description && (
              <p className="text-muted-foreground">{viewDocument.description}</p>
            )}
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {viewDocument?.content}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}