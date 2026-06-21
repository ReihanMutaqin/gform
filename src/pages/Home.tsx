import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toaster, toast } from "sonner";
import {
  Upload,
  Settings,
  Rocket,
  History,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import ExcelUploader from "@/components/custom/ExcelUploader";
import FormConfigPanel from "@/components/custom/FormConfigPanel";
import type { FormEntry, FormQuestion } from "@/components/custom/FormConfigPanel";
import BatchSubmit from "@/components/custom/BatchSubmit";
import ResultsTable from "@/components/custom/ResultsTable";
import { trpc } from "@/providers/trpc";

export default function Home() {
  const [names, setNames] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("upload");
  const [formConfig, setFormConfig] = useState<{
    formUrl: string;
    entries: FormEntry[];
    questions: FormQuestion[];
  } | null>(null);
  const [savedFormConfigId, setSavedFormConfigId] = useState<number | null>(null);

  const formById = trpc.form.getById.useQuery(
    { id: savedFormConfigId! },
    { enabled: !!savedFormConfigId }
  );

  const handleNamesLoaded = useCallback((loadedNames: string[]) => {
    setNames(loadedNames);
    if (loadedNames.length > 0) {
      toast.success(`${loadedNames.length} nama berhasil dimuat dari Excel!`);
    }
  }, []);

  const handleClearNames = useCallback(() => {
    setNames([]);
    toast.info("Daftar nama telah dikosongkan");
  }, []);

  const handleConfigChange = useCallback(
    (config: {
      formUrl: string;
      entries: FormEntry[];
      questions: FormQuestion[];
    }) => {
      setFormConfig(config);
    },
    []
  );

  const handleLoadSaved = useCallback((id: number) => {
    setSavedFormConfigId(id);
  }, []);

  // Load saved config data when formById returns data
  if (formById.data && savedFormConfigId) {
    const config = formById.data;
    if (
      !formConfig ||
      formConfig.formUrl !== config.formUrl
    ) {
      const entries = config.formEntries as FormEntry[];
      const questions = config.questions as FormQuestion[];
      setFormConfig({
        formUrl: config.formUrl,
        entries,
        questions,
      });
      setSavedFormConfigId(null);
      toast.success(`Konfigurasi "${config.name}" berhasil dimuat!`);
      setActiveTab("config");
    }
  }

  const handleSubmitComplete = useCallback(() => {
    toast.success("Batch submission selesai!");
    setActiveTab("results");
  }, []);

  const canSubmit =
    formConfig &&
    formConfig.formUrl &&
    formConfig.entries.some((e) => e.type === "name") &&
    formConfig.questions.length > 0 &&
    names.length > 0;

  // Get form config ID from saved configs
  const { data: savedConfigs } = trpc.form.list.useQuery();
  const activeFormId = savedConfigs?.find(
    (c) => c.formUrl === formConfig?.formUrl
  )?.id ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  GForm Batch Filler
                </h1>
                <p className="text-xs text-muted-foreground">
                  Isi Google Form secara batch dengan rating random
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {names.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {names.length} nama siap
                </Badge>
              )}
              {formConfig && (
                <Badge variant="default" className="gap-1 bg-indigo-600">
                  <Settings className="h-3 w-3" />
                  Form dikonfigurasi
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Upload className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{names.length}</p>
                  <p className="text-sm text-muted-foreground">Nama dari Excel</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formConfig?.questions.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pertanyaan Survei
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Rocket className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {canSubmit ? "Siap" : "Belum"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status Batch Submit
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checklist */}
        {!canSubmit && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-amber-800 mb-2">
                Checklist Sebelum Submit:
              </h3>
              <ul className="space-y-1 text-sm text-amber-700">
                <li className="flex items-center gap-2">
                  {names.length > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-amber-400" />
                  )}
                  Upload file Excel dengan daftar nama
                </li>
                <li className="flex items-center gap-2">
                  {formConfig?.formUrl ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-amber-400" />
                  )}
                  Masukkan URL Google Form
                </li>
                <li className="flex items-center gap-2">
                  {formConfig?.entries.some((e) => e.type === "name") ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-amber-400" />
                  )}
                  Tambahkan field Entry ID untuk Nama
                </li>
                <li className="flex items-center gap-2">
                  {(formConfig?.questions.length || 0) > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-amber-400" />
                  )}
                  Tambahkan minimal 1 pertanyaan untuk rating random
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

        <Separator className="mb-6" />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Excel
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Konfigurasi Form
            </TabsTrigger>
            <TabsTrigger
              value="submit"
              className="gap-2"
              disabled={!canSubmit}
            >
              <Rocket className="h-4 w-4" />
              Batch Submit
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <History className="h-4 w-4" />
              Riwayat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <ExcelUploader
              onNamesLoaded={handleNamesLoaded}
              names={names}
              onClear={handleClearNames}
            />
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <FormConfigPanel
              onConfigChange={handleConfigChange}
              onLoadSaved={handleLoadSaved}
              currentConfig={formConfig}
            />
          </TabsContent>

          <TabsContent value="submit" className="mt-6">
            {canSubmit && activeFormId ? (
              <BatchSubmit
                formConfigId={activeFormId}
                names={names}
                onSubmitComplete={handleSubmitComplete}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Lengkapi upload Excel dan konfigurasi form terlebih dahulu
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {activeFormId ? (
              <ResultsTable formConfigId={activeFormId} />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Simpan konfigurasi form terlebih dahulu untuk melihat riwayat
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>GForm Batch Filler - Tools pengisian survei otomatis</p>
            <p>Rating: 1=Sangat Kurang, 2=Kurang, 3=Cukup, 4=Bagus, 5=Sangat Bagus</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
