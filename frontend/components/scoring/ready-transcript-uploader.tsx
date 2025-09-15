import { useState } from "react";
import { uploadReadyTranscription } from "@/lib/api/scoring";

interface ReadyTranscriptUploaderProps {
  audioFileId: string;
  onUploaded?: () => void;
}

export function ReadyTranscriptUploader({ audioFileId, onUploaded }: ReadyTranscriptUploaderProps) {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleUpload() {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await uploadReadyTranscription({
        audio_file_id: audioFileId,
        text,
        language: language || undefined,
      });
      setSuccess(true);
      setText("");
      setLanguage("");
      if (onUploaded) onUploaded();
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        className="w-full border rounded p-2"
        rows={6}
        placeholder="Paste transcript text here..."
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={loading}
      />
      <input
        className="w-full border rounded p-2"
        placeholder="Language (optional, e.g. 'ru', 'en')"
        value={language}
        onChange={e => setLanguage(e.target.value)}
        disabled={loading}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleUpload}
        disabled={loading || !text.trim()}
      >
        {loading ? "Uploading..." : "Upload Transcript"}
      </button>
      {success && <div className="text-green-600">Transcript uploaded!</div>}
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
} 