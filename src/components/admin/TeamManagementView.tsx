import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import {
  Users,
  Shield,
  HardHat,
  Trash2,
  X,
  CheckCircle,
  KeyRound,
  UserPlus,
  UserCheck,
  Sparkles,
  ArrowLeft,
  Mail,
  Phone,
} from 'lucide-react';

interface TeamManagementViewProps {
  onBack?: () => void;
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({ onBack }) => {
  const { users, currentUser, addUser, updateUserRole, deleteUser, linkWorker } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('worker');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleLinkByCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setErrorMsg(null);
    setFeedbackMsg(null);
    setLinking(true);

    try {
      const res = await linkWorker(inputCode.trim());
      if (res.success) {
        setFeedbackMsg(`Operaio "${res.workerName || inputCode}" collegato con successo alla tua squadra!`);
        setInputCode('');
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'Nessun operaio trovato con questo codice.');
        setTimeout(() => setErrorMsg(null), 5000);
      }
    } finally {
      setLinking(false);
    }
  };

  const handleQuickApprove = async (workerCode?: string) => {
    if (!workerCode) return;
    setLinking(true);
    try {
      const res = await linkWorker(workerCode);
      if (res.success) {
        setFeedbackMsg(`Operaio "${res.workerName}" collegato con successo alla tua squadra!`);
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'Errore durante il collegamento');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    } finally {
      setLinking(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addUser({
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      active: true,
      linkedToAdmin: true,
    });

    setFeedbackMsg(`Account "${name.trim()}" aggiunto ed abilitato con successo.`);
    setTimeout(() => setFeedbackMsg(null), 4000);

    setName('');
    setEmail('');
    setPhone('');
    setRole('worker');
    setShowAddForm(false);
  };

  const handleRoleToggle = async (user: User) => {
    const newRole: UserRole = user.role === 'admin' ? 'worker' : 'admin';
    await updateUserRole(user.uid, newRole);
    setFeedbackMsg(`Ruolo di "${user.displayName}" aggiornato a ${newRole === 'admin' ? 'Titolare (Admin)' : 'Operaio'}`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.uid === currentUser?.uid) {
      setErrorMsg('Non puoi eliminare il tuo stesso account attualmente in uso.');
      setTimeout(() => setErrorMsg(null), 3500);
      setUserToDelete(null);
      return;
    }

    const deletedName = userToDelete.displayName;
    await deleteUser(userToDelete.uid);
    setUserToDelete(null);
    setFeedbackMsg(`Utente "${deletedName}" rimosso dalla squadra.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const pendingWorkers = users.filter((u) => u.role === 'worker' && u.linkedToAdmin === false);
  const activeMembers = users.filter((u) => u.role === 'admin' || u.linkedToAdmin !== false);

  return (
    <div className="space-y-[7px] max-w-4xl mx-auto pb-10">
      {/* Page Header (No popup modal: fully standard page view) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-[6px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Torna Indietro"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-[8px] bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Gestione Squadra & Operai
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Collega gli operai tramite il codice univoco, assegna i ruoli e gestisci i collaboratori.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-[6px] text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Aggiungi Collaboratore</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      {feedbackMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 p-2.5 px-3 rounded-[6px] text-xs text-emerald-800 dark:text-emerald-200 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 p-2.5 px-3 rounded-[6px] text-xs text-rose-800 dark:text-rose-200 font-semibold flex items-center gap-2 animate-in fade-in">
          <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Box: Collega Operaio Tramite Codice - Colori perfetti in entrambi i temi */}
      <div className="bg-emerald-50/70 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-[7px] p-3 sm:p-4 space-y-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
            Collega Operaio tramite Codice
          </h3>
        </div>
        <p className="text-xs text-emerald-950/80 dark:text-emerald-200/80 leading-relaxed">
          Quando un operaio si registra con Google dall'app mobile, riceve un codice univoco (es. <strong className="font-mono text-emerald-800 dark:text-emerald-300">OP-782A9C</strong>). Inserisci il codice qui sotto per abilitarlo e aggiungerlo alla squadra:
        </p>

        <form onSubmit={handleLinkByCodeSubmit} className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="INSERISCI CODICE (ES. OP-782A9C)"
            className="flex-1 p-2 px-3 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/80 rounded-[6px] font-mono text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 uppercase outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={linking || !inputCode.trim()}
            className="py-2 px-4 bg-emerald-800 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-[6px] text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <UserCheck className="w-4 h-4" />
            <span>{linking ? 'Collegamento...' : 'Collega alla Squadra'}</span>
          </button>
        </form>
      </div>

      {/* Operai in Attesa di Collegamento (se presenti) */}
      {pendingWorkers.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-[7px] p-3 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Operai in Attesa di Collegamento ({pendingWorkers.length})</span>
            </span>
          </div>

          <div className="space-y-2">
            {pendingWorkers.map((pw) => (
              <div
                key={pw.uid}
                className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-[6px] text-xs gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {pw.photoURL ? (
                    <img
                      src={pw.photoURL}
                      alt={pw.displayName}
                      className="w-8 h-8 rounded-[6px] object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-[6px] bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      <HardHat className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {pw.displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {pw.email} • Codice: <strong className="font-mono text-amber-800 dark:text-amber-300">{pw.workerCode}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickApprove(pw.workerCode)}
                  className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-[6px] text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Approvazione Rapida</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Aggiunta Collaboratore Manuale */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] space-y-3 text-xs shadow-xs"
        >
          <div className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Nuovo Collaboratore Manuale</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nome e Cognome *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Marco Bianchi"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Ruolo Iniziale
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="worker">Operaio (Accesso Schede e Rapportini)</option>
                <option value="admin">Titolare / Admin (Accesso Amministrativo Completo)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email (Opzionale)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marco@example.com"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Telefono (Opzionale)</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+39 333 ..."
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="py-1.5 px-3 rounded-[6px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="py-1.5 px-4 rounded-[6px] bg-emerald-800 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs"
            >
              Salva ed Abilita
            </button>
          </div>
        </form>
      )}

      {/* Squadra Attiva */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-3 sm:p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Squadra Attiva ({activeMembers.length})</span>
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Clicca sul ruolo per cambiarlo (Admin ↔ Operaio)
          </span>
        </div>

        <div className="space-y-2">
          {activeMembers.map((user) => {
            const isSelf = user.uid === currentUser?.uid;

            return (
              <div
                key={user.uid}
                className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[6px] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-9 h-9 rounded-[7px] object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-[7px] flex items-center justify-center font-bold text-white text-xs shrink-0 ${
                        user.role === 'admin'
                          ? 'bg-amber-600'
                          : 'bg-emerald-700'
                      }`}
                    >
                      {user.role === 'admin' ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <HardHat className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                      <span className="truncate">{user.displayName}</span>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                          TU
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email || 'Nessuna email'} {user.workerCode && `• Codice: ${user.workerCode}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto shrink-0">
                  <button
                    onClick={() => handleRoleToggle(user)}
                    disabled={isSelf}
                    className={`py-1.5 px-3 rounded-[6px] font-bold text-[11px] transition-colors border cursor-pointer ${
                      user.role === 'admin'
                        ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80 dark:hover:bg-amber-950/80'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80 dark:hover:bg-emerald-950/80'
                    } ${isSelf ? 'opacity-80 cursor-not-allowed' : ''}`}
                    title={
                      isSelf
                        ? 'Non puoi modificare il tuo stesso ruolo durante la sessione'
                        : 'Clicca per commutare il ruolo tra Admin e Operaio'
                    }
                  >
                    Ruolo: {user.role === 'admin' ? 'Titolare (Admin)' : 'Operaio'}
                  </button>

                  {!isSelf && (
                    <button
                      onClick={() => setUserToDelete(user)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded-[5px] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Rimuovi collaboratore"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Conferma Eliminazione Collaboratore */}
      {userToDelete && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm">Rimuovi Collaboratore</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Sei sicuro di voler rimuovere <strong>{userToDelete.displayName}</strong> dalla squadra?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[6px] text-xs font-semibold cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-1.5 px-3 bg-rose-700 hover:bg-rose-600 text-white rounded-[6px] text-xs font-bold transition-colors cursor-pointer"
              >
                Rimuovi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
