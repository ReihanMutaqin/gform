import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Plus,
  Trash2,
  HelpCircle,
  Save,
  ChevronRight,
  Link as LinkIcon,
  Hash,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

export interface FormEntry {
  entryId: string;
  type: "name" | "rating" | "text" | "email" | "other";
  label: string;
}

export interface FormQuestion {
  label: string;
  entryId: string;
}

interface FormConfigPanelProps {
  onConfigChange: (config: {
    formUrl: string;
    entries: FormEntry[];
    questions: FormQuestion[];
  }) => void;
  onLoadSaved: (id: number) => void;
  currentConfig: {
    formUrl: string;
    entries: FormEntry[];
    questions: FormQuestion[];
  } | null;
}

export default function FormConfigPanel({
  onConfigChange,
  onLoadSaved,
  currentConfig,
}: FormConfigPanelProps) {
  const [formUrl, setFormUrl] = useState(currentConfig?.formUrl || "");
  const [entries, setEntries] = useState<FormEntry[]>(
    currentConfig?.entries || []
  );
  const [questions, setQuestions] = useState<FormQuestion[]>(
    currentConfig?.questions || []
  );
  const [configName, setConfigName] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const savedConfigs = trpc.form.list.useQuery();
  const createConfig = trpc.form.create.useMutation({
    onSuccess: () => {
      savedConfigs.refetch();
      setConfigName("");
      alert("Konfigurasi berhasil disimpan!");
    },
  });
  const deleteConfig = trpc.form.delete.useMutation({
    onSuccess: () => savedConfigs.refetch(),
  });

  const updateParent = (url: string, ent: FormEntry[], quests: FormQuestion[]) => {
    onConfigChange({ formUrl: url, entries: ent, questions: quests });
  };

  const handleUrlChange = (url: string) => {
    setFormUrl(url);
    updateParent(url, entries, questions);
  };

  const addEntry = () => {
    const newEntries = [...entries, { entryId: "", type: "other" as const, label: "" }];
    setEntries(newEntries);
    updateParent(formUrl, newEntries, questions);
  };

  const updateEntry = (idx: number, field: keyof FormEntry, value: string) => {
    const newEntries = entries.map((e, i) =>
      i === idx ? { ...e, [field]: value } : e
    );
    setEntries(newEntries);
    updateParent(formUrl, newEntries, questions);
  };

  const removeEntry = (idx: number) => {
    const newEntries = entries.filter((_, i) => i !== idx);
    setEntries(newEntries);
    updateParent(formUrl, newEntries, questions);
  };

  const addQuestion = () => {
    const newQuestions = [...questions, { label: "", entryId: "" }];
    setQuestions(newQuestions);
    updateParent(formUrl, entries, newQuestions);
  };

  const updateQuestion = (idx: number, field: keyof FormQuestion, value: string) => {
    const newQuestions = questions.map((q, i) =>
      i === idx ? { ...q, [field]: value } : q
    );
    setQuestions(newQuestions);
    updateParent(formUrl, entries, newQuestions);
  };

  const removeQuestion = (idx: number) => {
    const newQuestions = questions.filter((_, i) => i !== idx);
    setQuestions(newQuestions);
    updateParent(formUrl, entries, newQuestions);
  };

  const handleSaveConfig = () => {
    if (!configName.trim()) {
      alert("Masukkan nama konfigurasi!");
      return;
    }
    if (!formUrl.trim()) {
      alert("Masukkan URL Google Form!");
      return;
    }
    createConfig.mutate({
      name: configName,
      formUrl,
      formEntries: entries,
      questions,
    });
  };

  const loadConfig = (id: number) => {
    onLoadSaved(id);
  };

  const nameEntry = entries.find((e) => e.type === "name");
  const canSubmit = formUrl && nameEntry && questions.length > 0;

  return (
    <div className="space-y-4">
      {/* Saved Configs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Save className="h-5 w-5 text-blue-600" />
            Konfigurasi Tersimpan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedConfigs.data && savedConfigs.data.length > 0 ? (
            <div className="space-y-2">
              {savedConfigs.data.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{config.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {config.formUrl}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadConfig(config.id)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteConfig.mutate({ id: config.id })}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum ada konfigurasi tersimpan
            </p>
          )}
        </CardContent>
      </Card>

      {/* Form URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LinkIcon className="h-5 w-5 text-indigo-600" />
            URL Google Form
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              value={formUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://docs.google.com/forms/d/.../viewform"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="text-muted-foreground"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Cara mendapatkan URL & Entry ID
            </Button>
            {showHelp && (
              <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                <p className="font-medium">Langkah-langkah:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>
                    Buka Google Form &gt; Klik titik tiga &gt; Pilih "Dapatkan
                    link pra-isi"
                  </li>
                  <li>Isi semua field dengan data dummy</li>
                  <li>
                    Klik "Dapatkan link" &gt; Klik "Salin link" - ini adalah URL
                    form Anda
                  </li>
                  <li>
                    Paste link di notepad, lalu copy hanya bagian entry ID (angka
                    panjang setelah entry.)
                  </li>
                </ol>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5 text-amber-600" />
            Field Form (Entry IDs)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tambahkan semua field form beserta entry ID-nya. Pastikan ada 1 field
            bertipe "Nama".
          </p>

          {entries.map((entry, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-end rounded-lg border p-3"
            >
              <div className="col-span-4">
                <Label className="text-xs">Label</Label>
                <Input
                  value={entry.label}
                  onChange={(e) => updateEntry(idx, "label", e.target.value)}
                  placeholder="Contoh: Nama Lengkap"
                  className="h-8"
                />
              </div>
              <div className="col-span-4">
                <Label className="text-xs">Entry ID</Label>
                <Input
                  value={entry.entryId}
                  onChange={(e) =>
                    updateEntry(idx, "entryId", e.target.value)
                  }
                  placeholder="1234567890"
                  className="h-8"
                />
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Tipe</Label>
                <Select
                  value={entry.type}
                  onValueChange={(v) => updateEntry(idx, "type", v)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nama</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="text">Teks</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(idx)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addEntry} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Tambah Field
          </Button>

          {nameEntry && (
            <Badge variant="default" className="bg-green-600">
              Field Nama: {nameEntry.label} (entry.{nameEntry.entryId})
            </Badge>
          )}
          {!nameEntry && entries.length > 0 && (
            <Badge variant="destructive">
              Belum ada field bertipe "Nama"!
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Questions for Random Rating */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-purple-600" />
            Pertanyaan untuk Rating Random
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tambahkan pertanyaan survei yang akan diisi dengan nilai random 1-5
            untuk setiap orang.
          </p>

          {questions.map((q, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-end rounded-lg border p-3"
            >
              <div className="col-span-6">
                <Label className="text-xs">Label Pertanyaan</Label>
                <Input
                  value={q.label}
                  onChange={(e) =>
                    updateQuestion(idx, "label", e.target.value)
                  }
                  placeholder="Contoh: Bagaimana pelayanannya?"
                  className="h-8"
                />
              </div>
              <div className="col-span-5">
                <Label className="text-xs">Entry ID</Label>
                <Input
                  value={q.entryId}
                  onChange={(e) =>
                    updateQuestion(idx, "entryId", e.target.value)
                  }
                  placeholder="1234567890"
                  className="h-8"
                />
              </div>
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(idx)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addQuestion} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Tambah Pertanyaan
          </Button>

          {questions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {questions.map((q, i) => (
                <Badge key={i} variant="secondary">
                  {i + 1}. {q.label || "(kosong)"}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Save Config */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Nama konfigurasi (untuk simpan)"
            />
            <Button
              onClick={handleSaveConfig}
              disabled={createConfig.isPending || !canSubmit}
              className="shrink-0"
            >
              <Save className="h-4 w-4 mr-1" />
              Simpan
            </Button>
          </div>
          {!canSubmit && (
            <p className="text-xs text-muted-foreground">
              Isi URL form, tambahkan field Nama, dan minimal 1 pertanyaan untuk
              mengaktifkan penyimpanan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
