import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useState } from 'react';
import { Plus, Trash2, Loader2, Users as UsersIcon, Search } from 'lucide-react';
import { useCreateTenant, useDeleteTenant, useTenants } from '../hooks/useTenents';
import type { Tenant } from '../lib/types/type';

export default function Tenants() {
  const { data, isLoading } = useTenants();
  const createTenant = useCreateTenant();
  const deleteTenant = useDeleteTenant();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', id_card: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTenant.mutateAsync(form);
    setOpen(false);
    setForm({ name: '', email: '', phone: '', id_card: '' });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <UsersIcon className="h-7 w-7 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tenant Management
            </h1>

            <p className="text-muted-foreground">
              Manage tenant profiles, contact details, and account status.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setOpen(true)}
          className="gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total Tenants',
            value: data?.data?.length || 0,
          },
          {
            title: 'Active',
            value:
              data?.data?.filter(
                (t: Tenant) => t.is_active,
              ).length || 0,
          },
          {
            title: 'Inactive',
            value:
              data?.data?.filter(
                (t: Tenant) => !t.is_active,
              ).length || 0,
          },
          {
            title: 'Registered',
            value: '100%',
          },
        ].map((item, index) => (
          <Card
            key={index}
            className="border-border/50 shadow-sm transition-all hover:shadow-lg"
          >
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
                  <UsersIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ================= TABLE ================= */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">
                Tenant Directory
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Overview of all registered tenants.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-[260px]">
              <Input
                placeholder="Search tenant..."
                className="pl-10"
              />

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Tenant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="rounded-full bg-muted p-3">
                          <UsersIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">No tenants found</p>
                        <p className="text-xs text-muted-foreground">Add tenants to manage your property</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((t: Tenant) => (
                    <TableRow
                      key={t.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {t.name?.charAt(0)}
                          </div>

                        <div>
                          <p className="font-medium">
                            {t.name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            ID #{t.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-muted-foreground">
                      {t.email || '-'}
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="text-muted-foreground">
                      {t.phone || '-'}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {t.is_active ? (
                        <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            deleteTenant.mutateAsync(t.id)
                          }
                          disabled={deleteTenant.isPending}
                        >
                          {deleteTenant.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="mr-1 h-4 w-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ================= DIALOG ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Add New Tenant
            </DialogTitle>

            <DialogDescription>
              Create a tenant profile and store contact
              information.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={submit}
            className="space-y-5 pt-2"
          >
            {/* Name */}
            <div className="space-y-2">
              <Label>Full Name</Label>

              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>Email Address</Label>

              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                placeholder="john@example.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>Phone Number</Label>

              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* ID Card */}
            <div className="space-y-2">
              <Label>ID Card Number</Label>

              <Input
                value={form.id_card}
                onChange={(e) =>
                  setForm({
                    ...form,
                    id_card: e.target.value,
                  })
                }
                placeholder="National ID / Passport"
              />
            </div>

            {/* Footer */}
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={createTenant.isPending}
                className="gap-2"
              >
                {createTenant.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}

                Add Tenant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
