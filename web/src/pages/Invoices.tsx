import { useInvoices, useGenerateInvoice, useGenerateAllInvoices, useRecordPayment, useApplyLateFees } from '../hooks/api';
import type { Invoice } from '../hooks/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useState } from 'react';
import { Plus, DollarSign, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Invoices() {
  const { data, isLoading } = useInvoices();
  const generateInvoice = useGenerateInvoice();
  const generateAll = useGenerateAllInvoices();
  const recordPayment = useRecordPayment();
  const applyLateFees = useApplyLateFees();
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ tenant_id: '', room_id: '', for_date: '' });
  const [payForm, setPayForm] = useState({ amount: '' });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateInvoice.mutateAsync({ tenant_id: parseInt(form.tenant_id), room_id: parseInt(form.room_id), for_date: form.for_date });
    setOpen(false); setForm({ tenant_id: '', room_id: '', for_date: '' });
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected) {
      await recordPayment.mutateAsync({ invoiceId: selected.id, paymentData: { amount: parseFloat(payForm.amount) } });
      setPayOpen(false); setPayForm({ amount: '' });
    }
  };

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Invoices</h1><p className="text-muted-foreground mt-1">Manage billing and payments.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateAll.mutateAsync({})} disabled={generateAll.isPending}>{generateAll.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Generate All</Button>
          <Button variant="outline" onClick={() => applyLateFees.mutateAsync({ grace_period_days: 3 })} disabled={applyLateFees.isPending}>{applyLateFees.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />} Late Fees</Button>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Invoice</Button>
        </div>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Tenant</TableHead><TableHead>Room</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead><TableHead>Paid</TableHead><TableHead>Status</TableHead><TableHead>Due</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.data?.map((inv: Invoice) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">#{inv.id}</TableCell>
                <TableCell>{inv.tenant?.name || '-'}</TableCell>
                <TableCell>{inv.room?.name || '-'}</TableCell>
                <TableCell>{inv.month}/{inv.year}</TableCell>
                <TableCell>${inv.amount.toFixed(2)}</TableCell>
                <TableCell>${inv.amount_paid.toFixed(2)}</TableCell>
                <TableCell><Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'late' ? 'destructive' : 'warning'}>{inv.status}</Badge></TableCell>
                <TableCell>{inv.due_date}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setSelected(inv); setPayOpen(true); }} disabled={inv.status === 'paid'}><DollarSign className="h-4 w-4 text-emerald-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Invoice</DialogTitle><DialogDescription>Create a new invoice.</DialogDescription></DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2"><Label>Tenant ID</Label><Input type="number" value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Room ID</Label><Input type="number" value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} required /></div>
            <div className="space-y-2"><Label>For Date</Label><Input type="date" value={form.for_date} onChange={(e) => setForm({ ...form, for_date: e.target.value })} required /></div>
            <DialogFooter><Button type="submit" disabled={generateInvoice.isPending}>{generateInvoice.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Generate</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Payment for invoice #{selected?.id}</DialogDescription></DialogHeader>
          <form onSubmit={handlePay} className="space-y-4">
            <div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ amount: e.target.value })} required /></div>
            <DialogFooter><Button type="submit" disabled={recordPayment.isPending}>{recordPayment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Record Payment</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
