import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { GuestBanner } from "@/components/GuestBanner";
import { isGuest } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Sparkles,
  RotateCcw,
  Download,
  Save,
  Trash2,
} from "lucide-react";

const BACKEND_URL =
  "https://sudhiksha2302-techrag-backend.hf.space/run/predict";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const guest = isGuest();

  const [inputText, setInputText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!guest && !sessionStorage.getItem("techniquerag-session")) {
      const user = localStorage.getItem("techniquerag-user");
      if (!user) navigate("/");
    }
  }, [navigate, guest]);

  async function analyzeCTI(text: string) {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [text] }),
    });

    if (!res.ok) {
      throw new Error("Backend request failed");
    }

    const json = await res.json();
    return json.data[0]; // Gradio output
  }

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter CTI text.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAnalyzing(true);
      const response = await analyzeCTI(inputText);

      setResult({
        summary:
          response.status === "ok"
            ? "MITRE techniques detected."
            : "No MITRE techniques detected.",
        techniques: response.techniques || [],
      });

      toast({
        title: "Analysis Complete",
        description: "Backend response received.",
      });
    } catch (err) {
      toast({
        title: "Analysis Failed",
        description: "Backend error occurred",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
  };

  const loadSample = () => {
    setInputText(
      "The attacker used Mimikatz to dump credentials from LSASS memory on a compromised Windows system."
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt") && !file.name.endsWith(".json")) {
      toast({
        title: "Invalid File Type",
        description: "Upload a .txt or .json file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setInputText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 container mx-auto px-4 pb-8">
        {guest && <GuestBanner />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* INPUT */}
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Input</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={loadSample}>
                  Load Sample
                </Button>
                <Button size="sm" variant="destructive" onClick={handleClear}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Label>CTI Content</Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[300px]"
            />

            <input
              type="file"
              accept=".txt,.json"
              onChange={handleFileUpload}
            />

            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full"
            >
              {analyzing ? (
                <>
                  <RotateCcw className="animate-spin mr-2 h-4 w-4" />
                  Analyzing
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze CTI
                </>
              )}
            </Button>
          </Card>

          {/* OUTPUT */}
          <Card className="p-6">
            {!result ? (
              <p className="text-muted-foreground">
                No analysis yet. Enter CTI text.
              </p>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-3">
                  Detected Techniques
                </h3>

                {result.techniques.length === 0 && (
                  <p className="text-muted-foreground">No techniques found.</p>
                )}

                <div className="space-y-3">
                  {result.techniques.map((t: any) => (
                    <div
                      key={t.id}
                      className="border rounded p-3 space-y-1"
                    >
                      <Badge>{t.id}</Badge>
                      <h4 className="font-semibold">{t.name}</h4>
                      <p className="text-sm">{t.description}</p>
                      <p className="text-sm font-bold">
                        Confidence: {(t.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
