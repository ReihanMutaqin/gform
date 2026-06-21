import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { History, CheckCircle2, XCircle, Clock } from "lucide-react";
import { trpc } from "@/providers/trpc";

interface ResultsTableProps {
  formConfigId: number;
}

export default function ResultsTable({ formConfigId }: ResultsTableProps) {
  const { data: submissions, isLoading } =
    trpc.submission.listByForm.useQuery({ formConfigId });

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1:
        return "Sangat Kurang";
      case 2:
        return "Kurang";
      case 3:
        return "Cukup";
      case 4:
        return "Bagus";
      case 5:
        return "Sangat Bagus";
      default:
        return String(rating);
    }
  };

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-orange-500";
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-green-500";
      case 5:
        return "bg-emerald-600";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Memuat data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mb-2 opacity-50" />
            <p>Belum ada riwayat pengisian</p>
            <p className="text-sm">Submit batch untuk melihat hasil di sini</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-slate-600" />
          Riwayat Pengisian ({submissions.length} entri)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jawaban</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub, idx) => {
                const answers = sub.answers as Record<
                  string,
                  { value: string | number; label: string }
                >;
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {sub.personName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(answers).map(
                          ([key, val]: [
                            string,
                            { value: string | number; label: string }
                          ]) => (
                            <Badge
                              key={key}
                              variant="secondary"
                              className={`text-xs ${
                                typeof val.value === "number"
                                  ? getRatingColor(val.value) + " text-white"
                                  : ""
                              }`}
                            >
                              {val.label}: {val.value}
                              {typeof val.value === "number"
                                ? ` (${getRatingLabel(val.value).substring(0, 3)})`
                                : ""}
                            </Badge>
                          )
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sub.status === "success" ? (
                        <Badge
                          variant="default"
                          className="bg-green-600 text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sukses
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Gagal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {sub.createdAt
                        ? new Date(sub.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
