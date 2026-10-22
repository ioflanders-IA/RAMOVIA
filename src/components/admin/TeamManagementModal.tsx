import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  HardHat,
  Trash2,
  X,
  Mail,
  Phone,
  HelpCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface TeamManagementModalProps {
  onClose: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({ onClose }) => {
  const { users, currentUser, addUser, updateUserRole, deleteUser } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('worker');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addUser({
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      active: true,
    });

    setFeedbackMsg(`Account "${name.trim()}" aggiunto con ruolo ${role === 'admin' ? 'Titolare (Admin)' : 'Operaio'}`);
    setTimeout(() => setFeedbackMsg(null), 4000);

    setName('');
    setEmail('');
    setPhone('');
    setRole('worker');
    setShowAddForm(false);
  };

  const handleRoleToggle = (user: User) => {
    const newRole: UserRole = user.role === 'admin' ? 'worker' : 'admin';
    updateUserRole(user.uid, newRole);
    setFeedbackMsg(`Ruolo di "${user.displayName}" aggiornato a ${newRole === 'admin' ? 'Titolare (Admin)' : 'Operaio'}`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleDelete = (user: User) => {
    if (user.uid === currentUser?.uid) {
      alert('Non puoi eliminare il tuo stesso account attualmente in uso.');
      return;
    }
    if (confirm(`Sei sicuro di voler rimuovere l'utente "${user.displayName}" dalla squadra?`)) {
      deleteUser(user.uid);
      setFeedbackMsg(`Utente "${user.displayName}" rimosso.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

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
              <h2 className="text-base font-bold text-white">Gestione Squadra & Assegnazione Operai</h2>
              <p className="text-xs text-emerald-200/80">
                Gestisci gli account del personale, assegna ruoli e abilita gli operai ai cantieri.
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

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-[7px] text-xs text-emerald-800 font-medium flex items-center gap-[7px]">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        <div className="p-[7px] space-y-[7px]">

          {/* Guide Box: How does worker access work? */}
          <div className="bg-slate-50 border border-slate-200 rounded-[7px] p-[7px] text-xs space-y-[7px]">
            <div className="font-bold text-slate-800 flex items-center gap-[7px] text-sm">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              <span>Come funziona l'accesso e l'assegnazione degli operai?</span>
            </div>
            <ol className="list-decimal list-inside space-y-[7px] text-slate-600 pl-1">
              <li>
                <strong>Crea o registra l'account:</strong> Aggiungi qui l'operaio specificando il suo nome ed eventuale email o telefono.
              </li>
              <li>
                <strong>Ruolo Operaio:</strong> Un utente con ruolo <em>Operaio</em> ha accesso esclusivo alla schermata <strong>"I Miei Interventi"</strong>, non vede prezzi o dati finanziari aziendali, e può solo compilare orari, materiali, foto e firma.
              </li>
              <li>
                <strong>Assegnazione cantieri:</strong> Quando pianifichi un intervento nel Calendario o nella Dashboard, seleziona il nome dell'operaio nel campo <em>"Operaio Assegnato"</em>. L'intervento apparirà istantaneamente sul suo dispositivo.
              </li>
              <li>
                <strong>Accesso da smartphone/tablet:</strong> L'operaio accede con la sua email oppure selezionando il proprio profilo dalla schermata di login.
              </li>
            </ol>
          </div>

          {/* Team Members List */}
          <div className="space-y-[7px]">
            <div className="flex items-center justify-between gap-[7px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Personale Registrato ({users.length})
              </h3>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-[7px] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] text-xs font-bold transition-colors shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Aggiungi Operaio / Collaboratore</span>
                </button>
              )}
            </div>

            {/* Add User Inline Form */}
            {showAddForm && (
              <form
                onSubmit={handleAddSubmit}
                className="bg-emerald-50/50 border border-emerald-200 rounded-[7px] p-[7px] space-y-[7px]"
              >
                <div className="flex items-center justify-between pb-[7px] border-b border-emerald-100">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-[7px]">
                    <UserPlus className="w-4 h-4 text-emerald-700" />
                    Nuovo Membro della Squadra
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Annulla
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px] text-xs">
                  <div className="space-y-[7px]">
                    <label className="block text-slate-700 font-medium">Nome e Cognome *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="es. Mario Rossi"
                      className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs focus:outline-emerald-600"
                    />
                  </div>

                  <div className="space-y-[7px]">
                    <label className="block text-slate-700 font-medium">Ruolo Operativo *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs font-semibold focus:outline-emerald-600"
                    >
                      <option value="worker">Operaio (Vista Mobile Cantiere)</option>
                      <option value="admin">Titolare / Admin (Accesso Completo)</option>
                    </select>
                  </div>

                  <div className="space-y-[7px]">
                    <label className="block text-slate-700 font-medium">Email (per login)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mario@azienda.it"
                      className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs focus:outline-emerald-600"
                    />
                  </div>

                  <div className="space-y-[7px]">
                    <label className="block text-slate-700 font-medium">Telefono</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+39 340 0000000"
                      className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-[7px] pt-[7px]">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-[7px] text-xs font-medium"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] text-xs font-bold transition-colors shadow-xs"
                  >
                    Salva Membro Squadra
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-[7px] overflow-hidden bg-white">
              {users.map((user) => {
                const isCurrent = user.uid === currentUser?.uid;
                const isAdmin = user.role === 'admin';

                return (
                  <div
                    key={user.uid}
                    className="p-[7px] flex flex-col sm:flex-row sm:items-center justify-between gap-[7px] hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-[7px]">
                      <div
                        className={`w-9 h-9 rounded-[7px] flex items-center justify-center font-bold text-xs ${
                          isAdmin ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        {isAdmin ? <Shield className="w-4 h-4 text-amber-700" /> : <HardHat className="w-4 h-4 text-emerald-700" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-[7px]">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {user.displayName}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-[7px] text-[10px] font-bold bg-slate-900 text-white">
                              TU (Sessione Attiva)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-[7px] text-[11px] text-slate-500 mt-0.5 font-mono">
                          {user.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {user.email}
                            </span>
                          )}
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-[7px] shrink-0 self-end sm:self-center">
                      {/* Toggle Role Button */}
                      <button
                        type="button"
                        onClick={() => handleRoleToggle(user)}
                        title="Clicca per cambiare ruolo"
                        className={`px-2.5 py-1.5 rounded-[7px] text-xs font-bold border transition-colors flex items-center gap-[7px] ${
                          isAdmin
                            ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <span>{isAdmin ? 'Ruolo: Titolare (Admin)' : 'Ruolo: Operaio'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">↺ Cambia</span>
                      </button>

                      {/* Delete */}
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          title="Rimuovi account"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-[7px] hover:bg-rose-50 transition-colors"
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
        <div className="bg-slate-50 p-[7px] border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-[7px] transition-colors"
          >
            Chiudi Gestione Squadra
          </button>
        </div>
      </div>
    </div>
  );
};
