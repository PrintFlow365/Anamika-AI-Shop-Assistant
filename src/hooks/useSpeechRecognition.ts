import { useState, useRef, useCallback, useEffect } from 'react';

export type RecognitionState = 'idle' | 'starting' | 'listening' | 'processing' | 'error';

export type ErrorKind = 'permission' | 'recording' | 'upload' | 'transcription' | 'timeout' | 'no-speech' | 'network' | 'unknown' | null;

export interface UseSpeechRecognitionResult {
  supported: boolean;
  state: RecognitionState;
  transcript: string;
  errorMessage: string;
  errorKind: ErrorKind;
  diagnosticInfo: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const MAX_RECORDING_MS = 30000;
const TRANSCRIBE_TIMEOUT_MS = 30000;

function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

export function useSpeechRecognition(lang = 'bn'): UseSpeechRecognitionResult {
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof MediaRecorder !== 'undefined';

  const [state, setState] = useState<RecognitionState>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState('');

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const stoppedByUserRef = useRef(false);

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  }, []);

  const cleanupRecorder = useCallback(() => {
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
  }, []);

  const cleanupAll = useCallback(() => {
    activeRef.current = false;
    cleanupRecorder();
    cleanupStream();
    audioChunksRef.current = [];
  }, [cleanupRecorder, cleanupStream]);

  useEffect(() => {
    return cleanupAll;
  }, [cleanupAll]);

  const sendToTranscription = useCallback(async (audioBlob: Blob) => {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) {
      setState('error');
      setErrorMessage('স্পিচ রিকগনিশন সার্ভিস কনফিগার করা হয়নি। নিচে হাতে লিখে এন্ট্রি করুন।');
      setErrorKind('transcription');
      setDiagnosticInfo('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      return;
    }

    setState('processing');
    setDiagnosticInfo('uploading audio for transcription...');

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', lang);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRANSCRIBE_TIMEOUT_MS);

    try {
      const response = await fetch(`${url}/functions/v1/transcribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${anonKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: 'Unknown error' }));
        setState('error');
        setErrorKind('transcription');
        setDiagnosticInfo(`transcribe HTTP ${response.status}: ${errBody.error || errBody.detail || 'unknown'}`);
        setErrorMessage('টেক্সট করতে সমস্যা হয়েছে। নিচে হাতে লিখে এন্ট্রি করুন।');
        return;
      }

      const data = await response.json();

      if (data.error === 'No speech detected' || (!data.transcript && !data.transcript?.trim())) {
        setState('error');
        setErrorKind('no-speech');
        setErrorMessage('কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।');
        setDiagnosticInfo('No speech detected by transcription service');
        return;
      }

      if (!data.transcript || typeof data.transcript !== 'string') {
        setState('error');
        setErrorKind('transcription');
        setErrorMessage('টেক্সট করতে সমস্যা হয়েছে। নিচে হাতে লিখে এন্ট্রি করুন।');
        setDiagnosticInfo(`Unexpected response: ${JSON.stringify(data).slice(0, 200)}`);
        return;
      }

      setTranscript(data.transcript.trim());
      setState('idle');
      setDiagnosticInfo('transcription complete');
    } catch (err) {
      clearTimeout(timeoutId);
      setState('error');
      if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorKind('timeout');
        setErrorMessage('টেক্সট করতে অনেক সময় লাগছে। আবার চেষ্টা করুন।');
        setDiagnosticInfo('Transcription request timed out');
      } else if (err instanceof TypeError) {
        setErrorKind('network');
        setErrorMessage('নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ চেক করুন।');
        setDiagnosticInfo(`Network error: ${err.message}`);
      } else {
        setErrorKind('unknown');
        setErrorMessage('টেক্সট করতে সমস্যা হয়েছে। নিচে হাতে লিখে এন্ট্রি করুন।');
        setDiagnosticInfo(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }, [lang]);

  const start = useCallback(async () => {
    if (!supported) return;
    if (activeRef.current) return;

    cleanupAll();
    activeRef.current = true;
    stoppedByUserRef.current = false;

    setErrorMessage('');
    setErrorKind(null);
    setTranscript('');
    setState('starting');
    setDiagnosticInfo('requesting microphone permission...');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      activeRef.current = false;
      setState('error');
      setErrorKind('permission');
      setDiagnosticInfo(`getUserMedia error: ${err instanceof Error ? err.message : String(err)}`);
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setErrorMessage('মাইক্রোফোন অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংসে অনুমতি দিন।');
      } else if (err instanceof DOMException && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
        setErrorMessage('মাইক্রোফোন পাওয়া যায়নি। ডিভাইস চেক করুন।');
        setErrorKind('recording');
      } else {
        setErrorMessage('মাইক্রোফোন চালু করা যায়নি। নিচে হাতে লিখে এন্ট্রি করুন।');
        setErrorKind('recording');
      }
      return;
    }

    if (!activeRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    mediaStreamRef.current = stream;
    audioChunksRef.current = [];

    // Pick the best supported mime type
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    let mimeType = '';
    for (const mt of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mt)) {
        mimeType = mt;
        break;
      }
    }

    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch (err) {
      activeRef.current = false;
      cleanupStream();
      setState('error');
      setErrorKind('recording');
      setErrorMessage('মাইক্রোফোন রেকর্ড করা যায়নি। নিচে হাতে লিখে এন্ট্রি করুন।');
      setDiagnosticInfo(`MediaRecorder error: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (ev: BlobEvent) => {
      if (ev.data && ev.data.size > 0) {
        audioChunksRef.current.push(ev.data);
      }
    };

    recorder.onstop = () => {
      cleanupStream();

      const chunks = audioChunksRef.current;
      if (chunks.length === 0) {
        activeRef.current = false;
        setState('error');
        setErrorKind('recording');
        setErrorMessage('কোনো অডিও রেকর্ড হয়নি। আবার চেষ্টা করুন।');
        setDiagnosticInfo('No audio chunks recorded');
        return;
      }

      const audioBlob = new Blob(chunks, { type: chunks[0].type || 'audio/webm' });
      audioChunksRef.current = [];

      if (!activeRef.current) {
        return;
      }

      sendToTranscription(audioBlob);
    };

    recorder.onerror = () => {
      cleanupStream();
      activeRef.current = false;
      setState('error');
      setErrorKind('recording');
      setErrorMessage('রেকর্ডিং সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setDiagnosticInfo('MediaRecorder.onerror');
    };

    try {
      recorder.start();
      setState('listening');
      setDiagnosticInfo('listening — tap stop when done');

      // Auto-stop after MAX_RECORDING_MS
      recordingTimeoutRef.current = setTimeout(() => {
        if (activeRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          setDiagnosticInfo('auto-stop: max recording time reached');
          try {
            mediaRecorderRef.current.stop();
          } catch {
            // ignore
          }
        }
      }, MAX_RECORDING_MS);
    } catch (err) {
      activeRef.current = false;
      cleanupStream();
      setState('error');
      setErrorKind('recording');
      setErrorMessage('রেকর্ডিং শুরু করা যায়নি। নিচে হাতে লিখে এন্ট্রি করুন।');
      setDiagnosticInfo(`recorder.start() error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [supported, cleanupAll, cleanupStream, sendToTranscription]);

  const stop = useCallback(() => {
    stoppedByUserRef.current = true;
    activeRef.current = false;

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    } else {
      cleanupStream();
      setState('idle');
    }
  }, [cleanupStream]);

  const reset = useCallback(() => {
    cleanupAll();
    setTranscript('');
    setErrorMessage('');
    setErrorKind(null);
    setState('idle');
    setDiagnosticInfo('');
  }, [cleanupAll]);

  return {
    supported,
    state,
    transcript,
    errorMessage,
    errorKind,
    diagnosticInfo,
    start,
    stop,
    reset,
  };
}
