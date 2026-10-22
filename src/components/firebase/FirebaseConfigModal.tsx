import React, { useState } from 'react';
import { X, Flame, Shield, Database, Check, Copy } from 'lucide-react';
import { FirebaseCustomConfig } from '../../services/firebase';

interface FirebaseConfigModalProps {
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const [apiKey, setApiKey] = useState(() => {
    try {
      const stored = localStorage.getItem('ramovia_firebase_config');
      return stored ? JSON.parse(stored).apiKey || '' : '';
    } catch {
      return '';
    }
  });

  const [projectId, setProjectId] = useState(() => {
    try {
      const stored = localStorage.getItem('ramovia_firebase_config');
      return stored ? JSON.parse(stored).projectId || 'ramovia-gardening' : 'ramovia-gardening';
    } catch {
      return 'ramovia-gardening';
    }
  });

  const [storageBucket, setStorageBucket] = useState(() => {
    try {
      const stored = localStorage.getItem('ramovia_firebase_config');
      return stored ? JSON.parse(stored).storageBucket || '' : '';
    } catch {
      return '';
    }
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: FirebaseCustomConfig = {
      apiKey,
      projectId,
      storageBucket,
      authDomain: `${projectId}.firebaseapp.com`,
    };
    localStorage.setItem('ramovia_firebase_config', JSON.stringify(config));
    setSaveSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isAdmin() { return isAuthenticated() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'; }

    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow write: if isAdmin();
    }
    match /clients/{clientId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    match /jobs/{jobId} {
      allow read: if isAuthenticated() && (isAdmin() || resource.data.assignedWorkerId == request.auth.uid);
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (resource.data.assignedWorkerId == request.auth.uid);
    }
    match /inventory/{itemId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      allow update: if isAuthenticated();
    }
    match /timesheets_and_reports/{reportId} {
      allow read: if isAuthenticated() && (isAdmin() || resource.data.workerId == request.auth.uid);
      allow create: if isAuthenticated();
      allow update: if isAdmin() || (resource.data.workerId == request.auth.uid);
    }
  }
}`;

  const copyRules = () => {
    navigator.clipboard.writeText(firestoreRulesSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-[7px] overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-[7px] shadow-2xl border border-slate-200 overflow-hidden my-2 max-h-[92vh] flex flex-col space-y-[7px]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-[7px] px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-[7px]">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold">Integrazione Firebase Cloud & Regole di Sicurezza</h2>
          </div>
          <button
            onClick={onClose}
            className="p-[7px] rounded-[7px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-[7px] overflow-y-auto space-y-[7px] text-xs text-slate-700">
          
          <div className="p-[7px] bg-emerald-50 border border-emerald-200 rounded-[7px] space-y-[7px]">
            <span className="font-bold text-emerald-900 flex items-center gap-[7px] text-xs">
              <Check className="w-4 h-4 text-emerald-700" />
              Architettura Cloud Firestore & Storage Configurate
            </span>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              L'applicazione supporta il salvataggio in tempo reale su Google Cloud Firestore e Firebase Storage. Se non fornisci chiavi custom, RAMOVIA funziona all'istante in modalità reattiva con persistenza locale completa e isolamento ruoli.
            </p>
          </div>

          {/* Config Form */}
          <form onSubmit={handleSave} className="space-y-[7px] bg-slate-50 border border-slate-200 rounded-[7px] p-[7px]">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-[7px]">
              <Database className="w-4 h-4 text-slate-600" />
              Credenziali Progetto Firebase (Opzionali)
            </h3>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Firebase Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="es. ramovia-prod"
                className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] font-mono text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Firebase Web API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] font-mono text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Storage Bucket (per foto cantiere)</label>
              <input
                type="text"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="es. ramovia-prod.appspot.com"
                className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] font-mono text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                className="p-[7px] px-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-[7px] shadow-xs flex items-center gap-[7px] transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salva Configurazione Firebase</span>
              </button>

              {saveSuccess && (
                <span className="text-emerald-700 font-bold">Salvato! Ricaricamento in corso...</span>
              )}
            </div>
          </form>

          {/* Firestore Rules */}
          <div className="space-y-[7px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-[7px]">
                <Shield className="w-4 h-4 text-emerald-700" />
                Regole di Sicurezza Firestore (firestore.rules)
              </span>
              <button
                type="button"
                onClick={copyRules}
                className="flex items-center gap-[7px] p-[7px] px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[7px] font-semibold text-[11px] transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copiato!' : 'Copia Regole'}</span>
              </button>
            </div>

            <pre className="p-[7px] bg-slate-900 text-emerald-400 rounded-[7px] overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800 max-h-40">
              {firestoreRulesSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-[7px] bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="p-[7px] px-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-[7px] text-xs transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
