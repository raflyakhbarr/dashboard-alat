'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusKondisiLabels, StatusKondisiColors, type RTGUnitWithGroup } from '@/types/rtg';
import { RTGHistoryDrawer } from './rtg-history-drawer';

interface RTGUnitsTableProps {
  rtgUnits: RTGUnitWithGroup[];
}

export function RTGUnitsTable({ rtgUnits }: RTGUnitsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'READY_CATATAN_RINGAN' | 'READY_CATATAN_BERAT' | 'TIDAK_READY'>('ALL');
  const [selectedRTG, setSelectedRTG] = useState<RTGUnitWithGroup | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter and search RTG units
  const filteredUnits = useMemo(() => {
    return rtgUnits.filter((unit) => {
      // Apply status filter
      if (statusFilter !== 'ALL' && unit.status_kondisi !== statusFilter) {
        return false;
      }

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          unit.kode_rtg.toLowerCase().includes(query) ||
          unit.nama_rtg.toLowerCase().includes(query) ||
          unit.group_rtg?.nama_group?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [rtgUnits, searchQuery, statusFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
  };

  const handleRowClick = (unit: RTGUnitWithGroup) => {
    setSelectedRTG(unit);
    setDrawerOpen(true);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'ALL';

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan kode, nama, atau group RTG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="READY_CATATAN_RINGAN">Catatan Ringan</SelectItem>
              <SelectItem value="READY_CATATAN_BERAT">Catatan Berat</SelectItem>
              <SelectItem value="TIDAK_READY">Tidak Ready</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Menampilkan {filteredUnits.length} dari {rtgUnits.length} unit RTG
        {hasActiveFilters && ' (filter aktif)'}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode RTG</TableHead>
              <TableHead>Nama Unit</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Terakhir Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.length > 0 ? (
              filteredUnits.map((unit) => (
                <TableRow
                  key={unit.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleRowClick(unit)}
                >
                  <TableCell className="font-medium">{unit.kode_rtg}</TableCell>
                  <TableCell>{unit.nama_rtg}</TableCell>
                  <TableCell>{unit.group_rtg?.nama_group || '-'}</TableCell>
                  <TableCell>
                    <Badge className={StatusKondisiColors[unit.status_kondisi]}>
                      {StatusKondisiLabels[unit.status_kondisi]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm" suppressHydrationWarning>
                    {unit.updated_at instanceof Date
                      ? unit.updated_at.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : new Date(unit.updated_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters
                    ? 'Tidak ada RTG yang sesuai dengan filter dan pencarian'
                    : 'Belum ada data RTG units'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* RTG History Drawer */}
      <RTGHistoryDrawer
        rtgUnit={selectedRTG}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
