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
  HelpCircle,
  KeyRound,
  UserPlus,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface TeamManagementModalProps {
  onClose: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({ onClose }) => {
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

  const handleDelete = async (user: User) => {
    if (user.uid === currentUser?.uid) {
      alert('Non puoi eliminare il tuo stesso account attualmente in uso.');
      return;
    }
    if (confirm(`Sei sicuro di voler rimuovere l'utente "${user.displayName}" dalla squadra?`)) {
      await deleteUser(user.uid);
      setFeedbackMsg(`Utente "${user.displayName}" rimosso.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const pendingWorkers = users.filter((u) => u.role === 'worker' && u.linkedToAdmin === false);
  const activeMembers = users.filter((u) => u.role === 'admin' || u.linkedToAdmin !== false);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-[7px] overflow-y-auto">
      <div className="w-full max-w-2xl rounded-[7px] bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900 my-4 space-y-[7px]">
        
        {/* Header */}
        <div className="bg-emerald-950 text-white p-[7px] px-3 flex items-center justify-between">
          <div className="flex items-center gap-[7px]">
            <div className="w-9 h-9 rounded-[7px] bg-emerald-800/80 flex items-center justify-center text-emerald-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gestione Squadra & Collegamento Operai</h2>
              <p className="text-xs text-emerald-200/80">
                Collega gli operai tramite il loro codice univoco o aggiungi collaboratori alla tua azienda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[7px] text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback messages */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-[7px] text-xs text-emerald-800 font-medium flex items-center gap-[7px]">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 p-[7px] text-xs text-rose-800 font-medium flex items-center gap-[7px]">
            <X className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-[7px] space-y-[7px] max-h-[80vh] overflow-y-auto">

          {/* Form 1: Link Worker by Code */}
          <div className="bg-emerald-950 text-white border border-emerald-900 rounded-[7px] p-[7px] space-y-[7px] shadow-sm">
            <div className="flex items-center gap-[7px]">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Collega Operaio tramite Codice
              </h3>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-relaxed">
              Quando un operaio si registra con Google, riceve un codice (es. <strong>OP-782A9C</strong>). Inserisci qui il suo codice per abilitarlo ed inserirlo nella tua squadra:
            </p>

            <form onSubmit={handleLinkByCodeSubmit} className="flex gap-[7px]">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Inserisci Codice (es. OP-782A9C)"
                className="flex-1 p-[7px] bg-emerald-900/90 border border-emerald-700 rounded-[7px] font-mono text-xs text-white placeholder-emerald-400 uppercase outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={linking || !inputCode.trim()}
                className="p-[7px] px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-[7px] text-xs transition-colors shadow-xs flex items-center gap-[7px] disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>Collega alla Squadra</span>
              </button>
            </form>
          </div>

          {/* Pending Workers Section (if any registered workers are waiting) */}
          {pendingWorkers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-[7px] p-[7px] space-y-[7px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Operai in Attesa di Collegamento ({pendingWorkers.length})
                </span>
              </div>

              <div className="space-y-[7px]">
                {pendingWorkers.map((pw) => (
                  <div
                    key={pw.uid}
                    className="flex items-center justify-between p-[7px] bg-white border border-amber-200 rounded-[7px] text-xs gap-[7px]"
                  >
                    <div className="flex items-center gap-[7px]">
                      {pw.photoURL ? (
                        <img
                          src={pw.photoURL}
                          alt={pw.displayName}
                          className="w-8 h-8 rounded-[7px] object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-[7px] bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                          O
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900">{pw.displayName}</div>
                        <div className="text-[10px] text-slate-500">
                          {pw.email} • Codice: <strong className="font-mono text-amber-900">{pw.workerCode}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleQuickApprove(pw.workerCode)}
                      className="p-[7px] px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-[7px] text-xs font-bold transition-colors shadow-xs flex items-center gap-[7px]"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approvazione Rapida</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Team Section */}
          <div className="space-y-[7px]">
            <div className="flex items-center justify-between gap-[7px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Squadra Attiva ({activeMembers.length})
              </h3>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-[7px] p-[7px] px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-[7px] text-xs font-bold transition-colors shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Aggiungi Collaboratore Manuale</span>
                </button>
              )}
            </div>

            {/* Manual Add Form */}
            {showAddForm && (
              <form
                onSubmit={handleAddSubmit}
                className="p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] space-y-[7px] text-xs"
              >
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex justify-between items-center">
                  <span>Nuovo Collaboratore Manuale</span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nome e Cognome *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="es. Marco Bianchi"
                      className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Ruolo Iniziale</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs"
                    >
                      <option value="worker">Operaio (Vista Mobile Cantiere)</option>
                      <option value="admin">Titolare / Admin (Accesso Completo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="marco@example.com"
                      className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Telefono</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+39 333 ..."
                      className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-[7px] pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="p-[7px] px-3 rounded-[7px] bg-slate-200 text-slate-700 font-semibold"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="p-[7px] px-4 rounded-[7px] bg-emerald-800 text-white font-bold"
                  >
                    Salva ed Abilita
                  </button>
                </div>
              </form>
            )}

            {/* Active Members List */}
            <div className="space-y-[7px]">
              {activeMembers.map((user) => {
                const isSelf = user.uid === currentUser?.uid;

                return (
                  <div
                    key={user.uid}
                    className="p-[7px] bg-white border border-slate-200 rounded-[7px] flex items-center justify-between gap-[7px] text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-[7px]">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-8 h-8 rounded-[7px] object-cover"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-[7px] flex items-center justify-center font-bold text-white text-xs ${
                            user.role === 'admin' ? 'bg-amber-600' : 'bg-emerald-700'
                          }`}
                        >
                          {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <HardHat className="w-4 h-4" />}
                        </div>
                      )}

                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-[7px]">
                          <span>{user.displayName}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded-[7px] bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              TU (Sessione Attiva)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {user.email || 'Nessuna email'} {user.workerCode && `• Codice: ${user.workerCode}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-[7px]">
                      <button
                        onClick={() => handleRoleToggle(user)}
                        disabled={isSelf}
                        className={`p-[7px] px-2.5 rounded-[7px] font-bold text-[11px] transition-colors border ${
                          user.role === 'admin'
                            ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                        } ${isSelf ? 'opacity-70 cursor-not-allowed' : ''}`}
                        title={isSelf ? 'Non puoi cambiare il tuo stesso ruolo durante la sessione' : 'Clicca per cambiare ruolo'}
                      >
                        Ruolo: {user.role === 'admin' ? 'Titolare (Admin)' : 'Operaio'}
                      </button>

                      {!isSelf && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-[7px] text-slate-400 hover:text-rose-700 rounded-[7px] hover:bg-rose-50 transition-colors"
                          title="Rimuovi dalla squadra"
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
        </div>

        {/* Footer */}
        <div className="p-[7px] bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="p-[7px] px-4 bg-slate-900 text-white font-bold rounded-[7px] text-xs hover:bg-slate-800 transition-colors"
          >
            Chiudi Gestione Squadra
          </button>
        </div>
      </div>
    </div>
  );
};
