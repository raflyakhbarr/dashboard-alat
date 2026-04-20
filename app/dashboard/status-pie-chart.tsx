'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusPieChartProps {
  ready: number;
  ready_catatan_ringan: number;
  ready_catatan_berat: number;
  tidak_ready: number;
  total_rtg: number;
}

export function StatusPieChart({
  ready,
  ready_catatan_ringan,
  ready_catatan_berat,
  tidak_ready,
  total_rtg,
}: StatusPieChartProps) {
  // Calculate percentages
  const totalUnits = total_rtg || 1;
  const readyPercent = Math.round((ready / totalUnits) * 100);

  // Data for pie chart
  const pieChartData = [
    { name: 'Ready', value: ready, color: '#22c55e' },
    { name: 'Catatan Ringan', value: ready_catatan_ringan, color: '#eab308' },
    { name: 'Catatan Berat', value: ready_catatan_berat, color: '#f97316' },
    { name: 'Tidak Ready', value: tidak_ready, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {pieChartData.length > 0 ? (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2">
              {ready > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Ready</span>
                  </div>
                  <span className="font-semibold">{ready} unit</span>
                </div>
              )}
              {ready_catatan_ringan > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Catatan Ringan</span>
                  </div>
                  <span className="font-semibold">{ready_catatan_ringan} unit</span>
                </div>
              )}
              {ready_catatan_berat > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>Catatan Berat</span>
                  </div>
                  <span className="font-semibold">{ready_catatan_berat} unit</span>
                </div>
              )}
              {tidak_ready > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Tidak Ready</span>
                  </div>
                  <span className="font-semibold">{tidak_ready} unit</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Belum ada data RTG
          </div>
        )}

        {/* Health Score */}
        {total_rtg > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                {/* <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {readyPercent}%
                </p> */}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Unit Ready</p>
                <p className="text-lg font-semibold">
                  {ready} / {total_rtg}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
