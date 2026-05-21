import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useState } from 'react';
import { Plus, DollarSign, Loader2, RefreshCw, AlertTriangle, Receipt, Download, Search } from 'lucide-react';
import { useApplyLateFees, useDownloadInvoice, useGenerateAllInvoices, useGenerateInvoice, useInvoices, useRecordPayment } from '../hooks/useInvoice';
import type { Invoice } from '../lib/types/type';

export default function Invoices() {
  const { data, isLoading, refetch } = useInvoices();
  const generateInvoice = useGenerateInvoice();
  const generateAll = useGenerateAllInvoices();
  const recordPayment = useRecordPayment();
  const applyLateFees = useApplyLateFees();
  const downloadInvoice = useDownloadInvoice();
  
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({ tenant_id: '', room_id: '', for_date: '' });
  const [payForm, setPayForm] = useState({ amount: '' });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateInvoice.mutateAsync({
      tenant_id: parseInt(form.tenant_id),
      room_id: parseInt(form.room_id),
      for_date: form.for_date
    });
    setOpen(false);
    setForm({ tenant_id: '', room_id: '', for_date: '' });
    refetch();
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected) {
      await recordPayment.mutateAsync({
        invoiceId: selected.id,
        paymentData: { amount: parseFloat(payForm.amount) }
      });
      setPayOpen(false);
      setPayForm({ amount: '' });
      refetch();
    }
  };

  const invoices = data?.data || [];
  const filteredInvoices = invoices.filter((inv: Invoice) => {
    const matchesSearch = inv.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter((inv: Invoice) => inv.status === 'paid').length,
    pending: invoices.filter((inv: Invoice) => inv.status === 'pending').length,
    late: invoices.filter((inv: Invoice) => inv.status === 'late').length,
    totalAmount: invoices.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0),
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">Paid</span>;
    }
    if (status === 'late') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-500 ring-1 ring-inset ring-rose-500/20">Late</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">Pending</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoice Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage billing, payments, invoices, and financial records.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => generateAll.mutateAsync({})}
            disabled={generateAll.isPending}
          >
            {generateAll.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Generate All
          </Button>

          <Button
            variant="outline"
            onClick={() => applyLateFees.mutateAsync({ grace_period_days: 3 })}
            disabled={applyLateFees.isPending}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
          >
            {applyLateFees.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
            Apply Late Fees
          </Button>

          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { title: 'Total Invoices', value: stats.total, icon: Receipt },
          { title: 'Paid', value: stats.paid, icon: DollarSign },
          { title: 'Pending', value: stats.pending, icon: RefreshCw },
          { title: 'Late', value: stats.late, icon: AlertTriangle },
          { title: 'Revenue', value: `$${stats.totalAmount.toFixed(2)}`, icon: DollarSign },
        ].map((item, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                  <h3 className="text-2xl font-bold mt-2">{item.value}</h3>
                </div>
                <div className="p-2 rounded-md bg-secondary text-muted-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Invoice History</h3>
            <p className="text-sm text-muted-foreground mt-1">View and manage all invoice transactions.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search invoice..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9" 
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="late">Late</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv: Invoice) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium text-sm">#{inv.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{inv.tenant?.name || '-'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{inv.tenant?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.room?.name || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.month}/{inv.year}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">${inv.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">${inv.amount_paid.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.due_date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={inv.status === 'paid'}
                          onClick={() => { setSelected(inv); setPayOpen(true); }}
                          className="h-8 px-2 text-muted-foreground"
                        >
                          <DollarSign className="h-4 w-4 mr-1.5" /> Pay
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => downloadInvoice.mutate(inv.id)}
                          disabled={downloadInvoice.isPending}
                        >
                          {downloadInvoice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
            <DialogDescription>
              Generate a new invoice manually.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Input
                type="number"
                value={form.tenant_id}
                onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Room ID</Label>
              <Input
                type="number"
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Date (YYYY-MM-DD)</Label>
              <Input
                type="date"
                value={form.for_date}
                onChange={(e) => setForm({ ...form, for_date: e.target.value })}
                required
              />
            </div>
            <DialogFooter className="pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={generateInvoice.isPending}>
                {generateInvoice.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Generate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter payment amount for Invoice #{selected?.id}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Amount Paid</Label>
              <Input
                type="number"
                step="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm({ amount: e.target.value })}
                required
              />
            </div>
            <DialogFooter className="pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordPayment.isPending}>
                {recordPayment.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
