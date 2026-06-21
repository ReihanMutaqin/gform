import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Rocket,
  Star,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shuffle,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

interface BatchSubmitProps {
  formConfigId: number;
  names: string[];
  onSubmitComplete: () => void;
}

export default function BatchSubmit({
  formConfigId,
  names,
  onSubmitComplete,
}: BatchSubmitProps) {
  const [ratingMin, setRatingMin] = useState(3);
  const [ratingMax, setRatingMax] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<
    Array<{
      name: string;
      status: string;
      answers?: Record<string, { value: string | number; label: string }>;
      error?: string;
    }>
  >([]);

  const submitBatch = trpc.submission.submitBatch.useMutation();

  const handleSubmit = async () => {
    if (names.length === 0) {
      alert("Tidak ada nama untuk diisi!");
      return;
    }

    setSubmitting(true);
    setResults([]);

    try {
      const response = await submitBatch.mutateAsync({
        formConfigId,
        names,
        ratingRange: { min: ratingMin, max: ratingMax },
      });

      setResults(response.results);
      onSubmitComplete();
    } catch (error) {
      console.error("Submit error:", error);
      alert("Gagal submit: " + (error instanceof Error ? error.message : "Unknown"));
    } finally {
      setSubmitting(false);
    }
  };

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

  const successCount = results.filter((r) => r.status === "success").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shuffle className="h-5 w-5 text-violet-600" />
            Konfigurasi Rating Random
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">
                  Range Rating Minimum
                </Label>
                <Badge
                  variant={ratingMin >= 4 ? "default" : "secondary"}
                  className={ratingMin >= 4 ? "bg-green-600" : ""}
                >
                  {ratingMin} - {getRatingLabel(ratingMin)}
                </Badge>
              </div>
              <Slider
                value={[ratingMin]}
                onValueChange={([v]) => {
                  setRatingMin(v);
                  if (v > ratingMax) setRatingMax(v);
                }}
                min={1}
                max={5}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 Sangat Kurang</span>
                <span>5 Sangat Bagus</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">
                  Range Rating Maksimum
                </Label>
                <Badge
                  variant={ratingMax >= 4 ? "default" : "secondary"}
                  className={ratingMax >= 4 ? "bg-green-600" : ""}
                >
                  {ratingMax} - {getRatingLabel(ratingMax)}
                </Badge>
              </div>
              <Slider
                value={[ratingMax]}
                onValueChange={([v]) => {
                  setRatingMax(v);
                  if (v < ratingMin) setRatingMin(v);
                }}
                min={1}
                max={5}
                step={1}
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>
                Rating akan di-generate random antara <strong>{ratingMin}</strong> sampai{" "}
                <strong>{ratingMax}</strong> untuk setiap pertanyaan dan setiap
                orang.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{names.length}</span>
                <span className="text-sm text-muted-foreground">orang</span>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <span className="text-lg font-semibold">
                  {ratingMin}-{ratingMax}
                </span>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || names.length === 0}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              <Rocket className="h-5 w-5 mr-2" />
              {submitting ? "Mengirim..." : "Submit Batch"}
            </Button>
          </div>

          {submitting && (
            <div className="space-y-2">
              <Progress value={0} className="animate-pulse" />
              <p className="text-sm text-center text-muted-foreground animate-pulse">
                Sedang mengisi form untuk {names.length} orang...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Hasil Pengisian</span>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {successCount} Sukses
                </Badge>
                {failedCount > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    {failedCount} Gagal
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 ${
                    result.status === "success"
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    <Badge
                      variant={
                        result.status === "success" ? "default" : "destructive"
                      }
                      className={
                        result.status === "success" ? "bg-green-600" : ""
                      }
                    >
                      {result.status === "success" ? "Sukses" : "Gagal"}
                    </Badge>
                  </div>

                  {result.status === "success" && result.answers && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(result.answers).map(
                        ([key, val]: [string, { value: string | number; label: string }]) => (
                          <Badge
                            key={key}
                            variant="secondary"
                            className={`${
                              typeof val.value === "number"
                                ? getRatingColor(val.value) + " text-white"
                                : ""
                            }`}
                          >
                            {val.label}: {val.value}
                            {typeof val.value === "number"
                              ? ` (${getRatingLabel(val.value)})`
                              : ""}
                          </Badge>
                        )
                      )}
                    </div>
                  )}

                  {result.error && (
                    <p className="text-sm text-red-600 mt-2">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>{children}</label>
  );
}
