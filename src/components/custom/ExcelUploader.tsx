import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, Users, X } from "lucide-react";
import { trpc } from "@/providers/trpc";

interface ExcelUploaderProps {
  onNamesLoaded: (names: string[]) => void;
  names: string[];
  onClear: () => void;
}

export default function ExcelUploader({
  onNamesLoaded,
  names,
  onClear,
}: ExcelUploaderProps) {
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [columnName, setColumnName] = useState("Nama");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseExcel = trpc.excel.parse.useMutation();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setParsing(true);

      try {
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        const result = await parseExcel.mutateAsync({
          base64,
          nameColumn: columnName,
        });

        onNamesLoaded(result.names);
      } catch (error) {
        console.error("Failed to parse Excel:", error);
        alert(
          "Gagal memparse Excel: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      } finally {
        setParsing(false);
      }
    },
    [columnName, parseExcel, onNamesLoaded]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Upload File Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="column-name">Nama Kolom Nama</Label>
              <Input
                id="column-name"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="Nama"
              />
              <p className="text-xs text-muted-foreground">
                Default: "Nama" - bisa juga "nama", "NAMA", "Name", "name"
              </p>
            </div>
            <div className="space-y-2">
              <Label>File Excel (.xlsx, .xls)</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={parsing}
              />
            </div>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1">{fileName}</span>
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                {names.length} orang
              </Badge>
              {names.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClear}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {parsing && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Memproses file Excel...
            </p>
          )}
        </CardContent>
      </Card>

      {names.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Daftar Nama ({names.length} orang)</span>
              <Button variant="outline" size="sm" onClick={onClear}>
                Hapus Semua
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">No</TableHead>
                    <TableHead>Nama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {names.map((name, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
