import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { GuestBanner } from "@/components/GuestBanner";
import { isGuest } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, Trash2, RotateCcw, FileText } from "lucide-react";
import { type AnalysisResult } from "@/lib/mockData";

/**
 * History Page
 * Displays past analysis results
 * Signed-in: Persistent mock history (TODO: connect to backend)
 * Guest: sessionStorage only, cleared on logout/refresh
 */
const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const guest = isGuest();
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredHistory, setFilteredHistory] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    // Load history based on user type
    if (guest) {
      const stored = sessionStorage.getItem('analysis-history');
      if (stored) {
        try {
          setHistory(JSON.parse(stored));
        } catch (error) {
          setHistory([]);
        }
      }
    } else {
      const load = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/history");
          if (!res.ok) throw new Error("Failed to fetch history");
          const data = await res.json();
          setHistory(data);
        } catch {
          setHistory([]);
        }
      };
      load();
    }
  }, [guest]);

  useEffect(() => {
    // Filter history based on search query
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = history.filter((item) => {
        return (
          item.inputText.toLowerCase().includes(query) ||
          item.techniques.some((t) => 
            t.id.toLowerCase().includes(query) ||
            t.name.toLowerCase().includes(query)
          )
        );
      });
      setFilteredHistory(filtered);
    }
  }, [searchQuery, history]);

  const handleDelete = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    
    if (guest) {
      sessionStorage.setItem('analysis-history', JSON.stringify(updated));
    } else {
      // TODO: Delete from backend
    }

    toast({
      title: "Deleted",
      description: "Analysis removed from history.",
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    if (guest) {
      sessionStorage.removeItem('analysis-history');
    }
    toast({
      title: "History Cleared",
      description: "All analysis history has been cleared.",
    });
  };

  const exportHistory = (format: 'csv' | 'pdf') => {
    toast({
      title: "Export Started",
      description: `Exporting history as ${format.toUpperCase()}...`,
    });

    // TODO: Implement actual export logic
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `History exported as ${format.toUpperCase()}.`,
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 container mx-auto px-4 pb-8">
        {guest && <GuestBanner />}

        <Card className="bg-card border-border p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-heading font-bold text-glow-cyan mb-2">
                Analysis History
              </h1>
              <p className="text-sm text-muted-foreground">
                {guest
                  ? "Session history (temporary)"
                  : "Your saved analysis results"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportHistory('csv')}
                className="border-border"
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportHistory('pdf')}
                className="border-border"
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              {history.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by technique ID, name, or content..."
              className="pl-10 bg-cyber-surface border-border"
            />
          </div>

          {/* History List */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-lg font-heading font-semibold mb-2">
                  {searchQuery ? "No Results Found" : "No History Yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : "Your analysis results will appear here"}
                </p>
              </div>
              {!searchQuery && (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Start Analyzing
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredHistory.map((item) => (
                <div key={item.id} className="bg-cyber-surface rounded-lg p-6 border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <h3 className="text-lg font-heading font-semibold mt-1">Analysis Summary</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" title="Re-analyze" className="hover:bg-cyber-elevated">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Export" className="hover:bg-cyber-elevated">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                        className="hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-cyber-surface rounded-lg p-4 border border-border mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Summary</p>
                    <p className="text-sm">{item.summary}</p>
                  </div>

                  <div>
                    <h4 className="text-md font-heading font-semibold mb-3">Detected Techniques</h4>
                    <div className="space-y-3">
                      {item.techniques.map((technique) => (
                        <div
                          key={technique.id}
                          className="bg-cyber-surface rounded-lg p-4 border border-border hover:border-primary transition-smooth"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="border-primary text-primary">
                                  {technique.id}
                                </Badge>
                                {technique.tacticName && (
                                  <Badge variant="secondary" className="text-xs">
                                    {technique.tacticName}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-sm">{technique.name}</h4>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                              <div className="text-lg font-bold text-primary">
                                {(technique.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          {technique.description && (
                            <p className="text-xs text-muted-foreground mt-2">{technique.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default History;
