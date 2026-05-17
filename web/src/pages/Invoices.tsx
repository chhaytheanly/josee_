import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useState } from 'react';
import { Plus, DollarSign, Loader2, RefreshCw, AlertTriangle, Receipt, Download, Search } from 'lucide-react';
import { useApplyLateFees, useGenerateAllInvoices, useGenerateInvoice, useInvoices, useRecordPayment } from '../hooks/useInvoice';
import type { Invoice } from '../lib/types/type';
import { motion, AnimatePresence } from 'framer-motion';

export default function Invoices() {
  const { data, isLoading, refetch } = useInvoices();
  const generateInvoice = useGenerateInvoice();
  const generateAll = useGenerateAllInvoices();
  const recordPayment = useRecordPayment();
  const applyLateFees = useApplyLateFees();
  const [_open, setOpen] = useState(false);
  const [_payOpen, setPayOpen] = useState(false);
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

  const filteredInvoices = data?.data?.filter((inv: Invoice) => {
    const matchesSearch = inv.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: data?.data?.length || 0,
    paid: data?.data?.filter((inv: Invoice) => inv.status === 'paid').length || 0,
    pending: data?.data?.filter((inv: Invoice) => inv.status === 'pending').length || 0,
    late: data?.data?.filter((inv: Invoice) => inv.status === 'late').length || 0,
    totalAmount: data?.data?.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary/20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      paid: {
        label: 'Paid',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200',
        icon: null
      },
      late: {
        label: 'Late',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200',
        icon: AlertTriangle
      },
      pending: {
        label: 'Pending',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200',
        icon: null
      },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge className={`${config.className} border px-3 py-1`}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Receipt className="h-7 w-7 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice Management
            </h1>

            <p className="text-muted-foreground">
              Manage billing, payments, invoices, and financial records.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => generateAll.mutateAsync({})}
            disabled={generateAll.isPending}
            className="gap-2"
          >
            {generateAll.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Generate All
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              applyLateFees.mutateAsync({
                grace_period_days: 3,
              })
            }
            disabled={applyLateFees.isPending}
            className="gap-2 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"
          >
            {applyLateFees.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            )}
            Apply Late Fees
          </Button>

          <Button
            onClick={() => setOpen(true)}
            className="gap-2 shadow-md"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            title: 'Total Invoices',
            value: stats.total,
            icon: Receipt,
          },
          {
            title: 'Paid',
            value: stats.paid,
            icon: DollarSign,
          },
          {
            title: 'Pending',
            value: stats.pending,
            icon: RefreshCw,
          },
          {
            title: 'Late',
            value: stats.late,
            icon: AlertTriangle,
          },
          {
            title: 'Revenue',
            value: `$${stats.totalAmount.toFixed(2)}`,
            icon: DollarSign,
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border/50 shadow-sm transition-all hover:shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {item.title}
                    </p>

                    <h3 className="text-2xl font-bold tracking-tight">
                      {item.value}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-primary/10 p-3">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ================= TABLE ================= */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">
                Invoice History
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                View and manage all invoice transactions.
              </p>
            </div>

            {/* FILTERS */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Search invoice..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="w-full pl-10 sm:w-[260px]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">
                    Amount
                  </TableHead>
                  <TableHead className="text-right">
                    Paid
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <AnimatePresence>
                  {filteredInvoices?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="rounded-full bg-muted p-3">
                            <Receipt className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium">No invoices found</p>
                          <p className="text-xs text-muted-foreground">
                            {searchTerm || statusFilter !== 'all' ? 'Try different filters' : 'Generate invoices to get started'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices?.map(
                    (inv: Invoice, index: number) => (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: index * 0.02,
                        }}
                        className="border-b transition-colors hover:bg-muted/40"
                      >
                        <TableCell className="font-medium">
                          #{inv.id}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {inv.tenant?.name || '-'}
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {inv.tenant?.email}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {inv.room?.name || '-'}
                        </TableCell>

                        <TableCell>
                          <span className="text-muted-foreground">
                            {inv.month}/{inv.year}
                          </span>
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          ${inv.amount.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right">
                          ${inv.amount_paid.toFixed(2)}
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(inv.status)}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {inv.due_date}
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                inv.status === 'paid'
                              }
                              onClick={() => {
                                setSelected(inv);
                                setPayOpen(true);
                              }}
                              className="h-8 gap-1"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              Pay
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}