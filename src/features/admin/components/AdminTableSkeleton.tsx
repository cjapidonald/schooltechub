import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminTableSkeletonProps {
  columns?: string[];
  rows?: number;
  showToolbar?: boolean;
}

const DEFAULT_COLUMNS = ["Item", "Status", "Owner", "Updated", "Actions"];

export const AdminTableSkeleton = ({
  columns = DEFAULT_COLUMNS,
  rows = 5,
  showToolbar = true,
}: AdminTableSkeletonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-background">
        {showToolbar && (
          <div className="flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <Skeleton className="h-10 w-full md:w-40" />
              <Skeleton className="h-10 w-full md:w-24" />
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Server-confirmed details</DrawerTitle>
            <DrawerDescription>
              Actions become available only after the server verifies the latest state. Optimistic updates are disabled until a
              response is received.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
          <DrawerFooter>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default AdminTableSkeleton;
